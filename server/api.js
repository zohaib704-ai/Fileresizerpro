// server/api.js - Backend API Server
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10 // Max 10 files
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads';
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Cleanup old files (runs every hour)
setInterval(async () => {
    try {
        const files = await fs.readdir(uploadDir);
        const now = Date.now();
        
        for (const file of files) {
            const filePath = path.join(uploadDir, file);
            const stats = await fs.stat(filePath);
            
            // Delete files older than 1 hour
            if (now - stats.mtimeMs > 60 * 60 * 1000) {
                await fs.unlink(filePath);
                console.log(`Cleaned up old file: ${file}`);
            }
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}, 60 * 60 * 1000);

// ==================== API ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'ImageResizer Pro API'
    });
});

// 1. Advanced Image Compression (Server-side)
app.post('/api/compress', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const { quality = 80, width, height, format = 'jpeg' } = req.body;
        
        // Process image with Sharp
        let image = sharp(req.file.buffer);
        
        // Resize if dimensions provided
        if (width || height) {
            image = image.resize({
                width: width ? parseInt(width) : null,
                height: height ? parseInt(height) : null,
                fit: 'inside',
                withoutEnlargement: true
            });
        }
        
        // Convert format
        const outputFormat = format.toLowerCase();
        let outputBuffer;
        
        switch (outputFormat) {
            case 'webp':
                outputBuffer = await image.webp({ quality: parseInt(quality) }).toBuffer();
                break;
            case 'png':
                outputBuffer = await image.png({ compressionLevel: 9 }).toBuffer();
                break;
            case 'jpeg':
            default:
                outputBuffer = await image.jpeg({ quality: parseInt(quality) }).toBuffer();
                break;
        }
        
        // Get image info
        const metadata = await sharp(req.file.buffer).metadata();
        const outputMetadata = await sharp(outputBuffer).metadata();
        
        res.json({
            success: true,
            original: {
                size: req.file.size,
                width: metadata.width,
                height: metadata.height,
                format: metadata.format
            },
            compressed: {
                size: outputBuffer.length,
                width: outputMetadata.width,
                height: outputMetadata.height,
                format: outputFormat
            },
            reduction: ((req.file.size - outputBuffer.length) / req.file.size * 100).toFixed(2),
            buffer: outputBuffer.toString('base64'),
            mimetype: `image/${outputFormat}`
        });
        
    } catch (error) {
        console.error('Compression error:', error);
        res.status(500).json({ error: 'Failed to compress image', details: error.message });
    }
});

// 2. Batch Image Processing
app.post('/api/batch-compress', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No images provided' });
        }

        const { quality = 80, format = 'jpeg' } = req.body;
        const results = [];
        
        // Process each image
        for (const file of req.files) {
            try {
                let image = sharp(file.buffer);
                const outputFormat = format.toLowerCase();
                let outputBuffer;
                
                switch (outputFormat) {
                    case 'webp':
                        outputBuffer = await image.webp({ quality: parseInt(quality) }).toBuffer();
                        break;
                    case 'png':
                        outputBuffer = await image.png({ compressionLevel: 9 }).toBuffer();
                        break;
                    default:
                        outputBuffer = await image.jpeg({ quality: parseInt(quality) }).toBuffer();
                        break;
                }
                
                const metadata = await sharp(file.buffer).metadata();
                const outputMetadata = await sharp(outputBuffer).metadata();
                
                results.push({
                    filename: file.originalname,
                    original: {
                        size: file.size,
                        width: metadata.width,
                        height: metadata.height
                    },
                    compressed: {
                        size: outputBuffer.length,
                        width: outputMetadata.width,
                        height: outputMetadata.height
                    },
                    reduction: ((file.size - outputBuffer.length) / file.size * 100).toFixed(2),
                    buffer: outputBuffer.toString('base64'),
                    mimetype: `image/${outputFormat}`
                });
                
            } catch (error) {
                console.error(`Failed to process ${file.originalname}:`, error);
                results.push({
                    filename: file.originalname,
                    error: 'Processing failed',
                    details: error.message
                });
            }
        }
        
        res.json({
            success: true,
            processed: results.length,
            results: results
        });
        
    } catch (error) {
        console.error('Batch processing error:', error);
        res.status(500).json({ error: 'Batch processing failed', details: error.message });
    }
});

// 3. PDF Compression (Advanced Feature)
app.post('/api/compress-pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file || req.file.mimetype !== 'application/pdf') {
            return res.status(400).json({ error: 'No PDF file provided' });
        }
        
        // Note: This is a placeholder. In production, use a PDF library like pdf-lib or Ghostscript
        const { quality = 'medium' } = req.body;
        
        // Simulate PDF compression (replace with actual PDF compression)
        const compressedSize = Math.round(req.file.size * 0.7); // 30% reduction simulation
        
        res.json({
            success: true,
            original: {
                size: req.file.size,
                pages: 1 // Would need actual PDF parsing
            },
            compressed: {
                size: compressedSize,
                reduction: ((req.file.size - compressedSize) / req.file.size * 100).toFixed(2)
            },
            message: 'PDF compression would happen here with proper libraries'
        });
        
    } catch (error) {
        console.error('PDF compression error:', error);
        res.status(500).json({ error: 'Failed to compress PDF', details: error.message });
    }
});

// 4. Background Removal (AI Feature - Integration)
app.post('/api/remove-background', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }
        
        // Note: This would integrate with a service like Remove.bg or a local AI model
        const { api_key } = req.body;
        
        if (!api_key) {
            return res.status(400).json({ 
                error: 'API key required',
                note: 'For production, integrate with Remove.bg, BackgroundRemover.ai, or similar service'
            });
        }
        
        // Placeholder response
        res.json({
            success: true,
            message: 'Background removal would integrate with AI service',
            services: [
                'Remove.bg (commercial)',
                'BackgroundRemover.ai (commercial)',
                'U^2-Net (open source, self-hosted)',
                'Rembg (Python library)'
            ],
            estimated_cost: '$0.02 - $0.10 per image'
        });
        
    } catch (error) {
        console.error('Background removal error:', error);
        res.status(500).json({ error: 'Background removal failed', details: error.message });
    }
});

// 5. Image Analysis (Metadata, Colors, etc.)
app.post('/api/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }
        
        const image = sharp(req.file.buffer);
        const metadata = await image.metadata();
        const stats = await image.stats();
        
        // Extract dominant colors
        const { dominant } = stats;
        const dominantColors = [];
        
        if (dominant && dominant.r && dominant.g && dominant.b) {
            dominantColors.push({
                rgb: `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`,
                hex: `#${((1 << 24) + (dominant.r << 16) + (dominant.g << 8) + dominant.b).toString(16).slice(1)}`
            });
        }
        
        res.json({
            success: true,
            metadata: {
                format: metadata.format,
                width: metadata.width,
                height: metadata.height,
                size: req.file.size,
                space: metadata.space,
                channels: metadata.channels,
                density: metadata.density,
                hasAlpha: metadata.hasAlpha,
                isProgressive: metadata.isProgressive,
                orientation: metadata.orientation
            },
            colors: {
                dominant: dominantColors,
                average: stats.channels.map(ch => ch.mean)
            },
            histogram: stats.channels.map(ch => ({
                min: ch.min,
                max: ch.max,
                sum: ch.sum,
                squaresSum: ch.squaresSum,
                mean: ch.mean,
                stdev: ch.stdev
            }))
        });
        
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze image', details: error.message });
    }
});

// 6. URL to Image (Screenshot Service)
app.post('/api/screenshot', async (req, res) => {
    try {
        const { url, width = 1200, height = 800 } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        // Note: This would use Puppeteer or similar for actual screenshots
        res.json({
            success: true,
            message: 'Screenshot service would capture the webpage',
            url: url,
            dimensions: `${width}x${height}`,
            note: 'Requires Puppeteer/Playwright setup on server'
        });
        
    } catch (error) {
        console.error('Screenshot error:', error);
        res.status(500).json({ error: 'Screenshot failed', details: error.message });
    }
});

// 7. Text Extraction (Server-side OCR - More accurate)
app.post('/api/ocr', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }
        
        const { language = 'eng', psm = 6 } = req.body;
        
        // Note: This would use Tesseract.js server-side for better accuracy
        res.json({
            success: true,
            message: 'Server-side OCR would provide better accuracy',
            language: language,
            psm: psm,
            note: 'Install Tesseract OCR on server and use tesseract.js wrapper'
        });
        
    } catch (error) {
        console.error('OCR error:', error);
        res.status(500).json({ error: 'OCR failed', details: error.message });
    }
});

// 8. Image Conversion (Advanced formats)
app.post('/api/convert', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }
        
        const { format = 'webp', options = {} } = req.body;
        const validFormats = ['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif'];
        
        if (!validFormats.includes(format.toLowerCase())) {
            return res.status(400).json({ 
                error: 'Invalid format',
                validFormats: validFormats 
            });
        }
        
        const image = sharp(req.file.buffer);
        const outputBuffer = await image.toFormat(format, options).toBuffer();
        const metadata = await sharp(outputBuffer).metadata();
        
        res.json({
            success: true,
            originalFormat: req.file.mimetype,
            convertedFormat: `image/${format}`,
            size: outputBuffer.length,
            dimensions: `${metadata.width}x${metadata.height}`,
            buffer: outputBuffer.toString('base64')
        });
        
    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
});

// 9. Watermark Addition
app.post('/api/watermark', upload.fields([{ name: 'image' }, { name: 'watermark' }]), async (req, res) => {
    try {
        if (!req.files.image || !req.files.watermark) {
            return res.status(400).json({ error: 'Both image and watermark are required' });
        }
        
        const { position = 'bottom-right', opacity = 0.7, scale = 0.2 } = req.body;
        
        const image = sharp(req.files.image[0].buffer);
        const watermark = sharp(req.files.watermark[0].buffer);
        
        // Get dimensions
        const imageMetadata = await image.metadata();
        const watermarkMetadata = await watermark.metadata();
        
        // Calculate watermark size and position
        const watermarkWidth = Math.round(imageMetadata.width * scale);
        const watermarkHeight = Math.round((watermarkMetadata.height / watermarkMetadata.width) * watermarkWidth);
        
        const resizedWatermark = await watermark
            .resize(watermarkWidth, watermarkHeight)
            .composite([{ input: Buffer.from([255, 255, 255, opacity * 255]), raw: { width: 1, height: 1, channels: 4 } }])
            .toBuffer();
        
        // Calculate position
        let left, top;
        switch (position) {
            case 'top-left':
                left = 10;
                top = 10;
                break;
            case 'top-right':
                left = imageMetadata.width - watermarkWidth - 10;
                top = 10;
                break;
            case 'bottom-left':
                left = 10;
                top = imageMetadata.height - watermarkHeight - 10;
                break;
            case 'center':
                left = Math.round((imageMetadata.width - watermarkWidth) / 2);
                top = Math.round((imageMetadata.height - watermarkHeight) / 2);
                break;
            case 'bottom-right':
            default:
                left = imageMetadata.width - watermarkWidth - 10;
                top = imageMetadata.height - watermarkHeight - 10;
                break;
        }
        
        // Apply watermark
        const outputBuffer = await image
            .composite([{
                input: resizedWatermark,
                top: top,
                left: left
            }])
            .toBuffer();
        
        res.json({
            success: true,
            position: position,
            opacity: opacity,
            scale: scale,
            size: outputBuffer.length,
            buffer: outputBuffer.toString('base64')
        });
        
    } catch (error) {
        console.error('Watermark error:', error);
        res.status(500).json({ error: 'Watermark failed', details: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 10' });
        }
    }
    
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 API endpoints available at http://localhost:${PORT}/api`);
});

module.exports = app;