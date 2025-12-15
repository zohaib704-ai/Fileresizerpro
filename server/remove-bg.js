// server/remove-bg.js - Background Removal Service
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

class BackgroundRemover {
    constructor(apiKeys = {}) {
        this.services = {
            removebg: {
                name: 'Remove.bg',
                url: 'https://api.remove.bg/v1.0/removebg',
                apiKey: apiKeys.removebg,
                costPerImage: 0.02 // $0.02 per image
            },
            backgrounds: {
                name: 'BackgroundRemover.ai',
                url: 'https://api.backgroundremover.ai/v1/remove',
                apiKey: apiKeys.backgrounds,
                costPerImage: 0.03
            },
            clipdrop: {
                name: 'Clipdrop by Stability AI',
                url: 'https://clipdrop-api.co/remove-background/v1',
                apiKey: apiKeys.clipdrop,
                costPerImage: 0.10
            }
        };
        
        // Local AI models (open source)
        this.localModels = {
            'u2net': {
                name: 'U^2-Net',
                description: 'State-of-the-art saliency object detection',
                github: 'https://github.com/xuebinqin/U-2-Net',
                size: '176MB'
            },
            'rembg': {
                name: 'Rembg',
                description: 'Python library with multiple models',
                github: 'https://github.com/danielgatis/rembg',
                size: 'Various'
            },
            'modnet': {
                name: 'MODNet',
                description: 'Real-time portrait matting',
                github: 'https://github.com/ZHKKKe/MODNet',
                size: '24MB'
            }
        };
    }
    
    async removeWithService(serviceName, imageBuffer, options = {}) {
        const service = this.services[serviceName];
        
        if (!service) {
            throw new Error(`Service ${serviceName} not configured`);
        }
        
        if (!service.apiKey) {
            throw new Error(`API key for ${service.name} is required`);
        }
        
        const formData = new FormData();
        formData.append('image_file', imageBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });
        
        // Add options
        if (options.size) formData.append('size', options.size);
        if (options.type) formData.append('type', options.type);
        if (options.format) formData.append('format', options.format);
        if (options.bg_color) formData.append('bg_color', options.bg_color);
        
        try {
            const response = await axios.post(service.url, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'X-Api-Key': service.apiKey
                },
                responseType: 'arraybuffer'
            });
            
            return {
                success: true,
                service: service.name,
                buffer: Buffer.from(response.data),
                contentType: response.headers['content-type'] || 'image/png',
                cost: service.costPerImage
            };
            
        } catch (error) {
            console.error(`${service.name} error:`, error.response?.data || error.message);
            
            if (error.response?.status === 402) {
                throw new Error(`${service.name}: Payment required or insufficient credits`);
            }
            if (error.response?.status === 429) {
                throw new Error(`${service.name}: Rate limit exceeded`);
            }
            
            throw new Error(`${service.name} failed: ${error.message}`);
        }
    }
    
    async removeWithLocalModel(modelName, imageBuffer, options = {}) {
        // Note: This is a placeholder for local model integration
        // In production, you would:
        // 1. Download the model weights
        // 2. Set up TensorFlow.js or ONNX Runtime
        // 3. Run inference locally
        
        const model = this.localModels[modelName];
        
        if (!model) {
            throw new Error(`Local model ${modelName} not available`);
        }
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // For demo purposes, create a simple mask-based removal
        const metadata = await sharp(imageBuffer).metadata();
        
        // Create a simple circular mask for demonstration
        const maskBuffer = await sharp({
            create: {
                width: metadata.width,
                height: metadata.height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .composite([{
            input: Buffer.from([255, 255, 255, 255]),
            raw: { width: 1, height: 1, channels: 4 },
            tile: true,
            blend: 'dest-in'
        }])
        .png()
        .toBuffer();
        
        // Apply mask to create transparent background
        const resultBuffer = await sharp(imageBuffer)
            .ensureAlpha()
            .composite([{
                input: maskBuffer,
                blend: 'dest-in'
            }])
            .png()
            .toBuffer();
        
        return {
            success: true,
            service: `Local: ${model.name}`,
            buffer: resultBuffer,
            contentType: 'image/png',
            cost: 0,
            note: 'This is a demo. Install proper model for accurate results.'
        };
    }
    
    async autoRemoveBackground(imageBuffer, options = {}) {
        const {
            priority = ['local', 'removebg', 'backgrounds', 'clipdrop'],
            fallbackToLocal = true,
            maxFileSize = 10 * 1024 * 1024 // 10MB
        } = options;
        
        // Check file size
        if (imageBuffer.length > maxFileSize) {
            throw new Error(`File too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`);
        }
        
        // Try services in order of priority
        for (const serviceName of priority) {
            try {
                if (serviceName === 'local') {
                    return await this.removeWithLocalModel('u2net', imageBuffer, options);
                } else if (this.services[serviceName]) {
                    return await this.removeWithService(serviceName, imageBuffer, options);
                }
            } catch (error) {
                console.warn(`${serviceName} failed:`, error.message);
                continue; // Try next service
            }
        }
        
        // If all fail and fallback is enabled, try basic transparency
        if (fallbackToLocal) {
            return await this.createBasicTransparency(imageBuffer);
        }
        
        throw new Error('All background removal services failed');
    }
    
    async createBasicTransparency(imageBuffer) {
        // Create a basic transparent background by thresholding
        const metadata = await sharp(imageBuffer).metadata();
        
        // Convert to RGBA with white background made transparent
        const resultBuffer = await sharp(imageBuffer)
            .ensureAlpha()
            .threshold(240) // Make light colors transparent
            .png()
            .toBuffer();
        
        return {
            success: true,
            service: 'Basic Transparency',
            buffer: resultBuffer,
            contentType: 'image/png',
            cost: 0,
            note: 'Basic threshold-based transparency applied'
        };
    }
    
    async replaceBackground(imageBuffer, backgroundBuffer, options = {}) {
        try {
            // Remove background from main image
            const foreground = await this.autoRemoveBackground(imageBuffer, options);
            
            // Composite with new background
            const foregroundImage = sharp(foreground.buffer);
            const backgroundImage = sharp(backgroundBuffer);
            
            // Get dimensions
            const fgMetadata = await foregroundImage.metadata();
            const bgMetadata = await backgroundImage.metadata();
            
            // Resize background to match foreground if needed
            if (fgMetadata.width !== bgMetadata.width || fgMetadata.height !== bgMetadata.height) {
                backgroundImage.resize(fgMetadata.width, fgMetadata.height, {
                    fit: 'cover'
                });
            }
            
            // Composite images
            const resultBuffer = await backgroundImage
                .composite([{
                    input: await foregroundImage.toBuffer(),
                    blend: 'over'
                }])
                .jpeg({ quality: 90 })
                .toBuffer();
            
            return {
                success: true,
                buffer: resultBuffer,
                contentType: 'image/jpeg',
                dimensions: `${fgMetadata.width}x${fgMetadata.height}`
            };
            
        } catch (error) {
            throw new Error(`Background replacement failed: ${error.message}`);
        }
    }
    
    async batchRemoveBackground(imageBuffers, options = {}) {
        const results = [];
        const { concurrent = 3 } = options;
        
        // Process images in batches to avoid rate limits
        for (let i = 0; i < imageBuffers.length; i += concurrent) {
            const batch = imageBuffers.slice(i, i + concurrent);
            const batchPromises = batch.map((buffer, index) =>
                this.autoRemoveBackground(buffer, options)
                    .then(result => ({ success: true, result, index: i + index }))
                    .catch(error => ({ success: false, error: error.message, index: i + index }))
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Delay between batches to avoid rate limits
            if (i + concurrent < imageBuffers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        return {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            results: results,
            estimatedCost: successful.length * 0.02 // Approximate cost
        };
    }
    
    // Utility methods
    async validateImage(buffer) {
        try {
            const metadata = await sharp(buffer).metadata();
            return {
                valid: true,
                format: metadata.format,
                width: metadata.width,
                height: metadata.height,
                size: buffer.length,
                hasAlpha: metadata.hasAlpha
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
    
    async optimizeForWeb(buffer, options = {}) {
        const {
            maxWidth = 2000,
            maxHeight = 2000,
            quality = 80,
            format = 'webp'
        } = options;
        
        let image = sharp(buffer);
        const metadata = await image.metadata();
        
        // Resize if too large
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
            image = image.resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }
        
        // Convert to webp for best compression
        const optimizedBuffer = await image
            .toFormat(format, { quality })
            .toBuffer();
        
        const reduction = ((buffer.length - optimizedBuffer.length) / buffer.length * 100).toFixed(2);
        
        return {
            success: true,
            originalSize: buffer.length,
            optimizedSize: optimizedBuffer.length,
            reduction: `${reduction}%`,
            format: format,
            buffer: optimizedBuffer
        };
    }
}

module.exports = BackgroundRemover;
