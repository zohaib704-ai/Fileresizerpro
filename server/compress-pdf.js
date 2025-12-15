// server/compress-pdf.js - PDF Compression Service
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class PDFCompressor {
    constructor() {
        this.supportedMethods = ['ghostscript', 'qpdf', 'pdf-lib'];
    }
    
    async compressWithGhostscript(inputPath, outputPath, quality = 'ebook') {
        // Quality presets: 'screen', 'ebook', 'printer', 'prepress', 'default'
        const qualityMap = {
            'screen': '/screen',
            'ebook': '/ebook',
            'printer': '/printer',
            'prepress': '/prepress',
            'default': '/default'
        };
        
        const dpi = quality === 'screen' ? 72 : 150;
        const qualitySetting = qualityMap[quality] || '/ebook';
        
        const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
            -dPDFSETTINGS=${qualitySetting} \
            -dNOPAUSE -dQUIET -dBATCH \
            -dColorImageResolution=${dpi} \
            -dGrayImageResolution=${dpi} \
            -dMonoImageResolution=${dpi} \
            -sOutputFile="${outputPath}" "${inputPath}"`;
        
        try {
            await execPromise(command);
            const stats = await fs.stat(outputPath);
            return { success: true, size: stats.size };
        } catch (error) {
            throw new Error(`Ghostscript compression failed: ${error.message}`);
        }
    }
    
    async compressWithQPdf(inputPath, outputPath, options = {}) {
        // qpdf is a powerful PDF transformation tool
        const { linearize = true, removeUnused = true, compressStreams = true } = options;
        
        let command = `qpdf "${inputPath}" "${outputPath}"`;
        
        if (linearize) command += ' --linearize';
        if (removeUnused) command += ' --remove-unreferenced-resources=yes';
        if (compressStreams) command += ' --compress-streams=y';
        
        // Add object stream compression
        command += ' --object-streams=generate';
        
        try {
            await execPromise(command);
            const stats = await fs.stat(outputPath);
            return { success: true, size: stats.size };
        } catch (error) {
            throw new Error(`qPDF compression failed: ${error.message}`);
        }
    }
    
    async compress(inputBuffer, options = {}) {
        const {
            method = 'ghostscript',
            quality = 'ebook',
            maxSizeMB = 5,
            tempDir = './temp'
        } = options;
        
        // Create temp directory if it doesn't exist
        await fs.mkdir(tempDir, { recursive: true });
        
        const timestamp = Date.now();
        const inputFilename = `input_${timestamp}.pdf`;
        const outputFilename = `compressed_${timestamp}.pdf`;
        
        const inputPath = path.join(tempDir, inputFilename);
        const outputPath = path.join(tempDir, outputFilename);
        
        try {
            // Write input buffer to temp file
            await fs.writeFile(inputPath, inputBuffer);
            
            let result;
            
            switch (method.toLowerCase()) {
                case 'ghostscript':
                    result = await this.compressWithGhostscript(inputPath, outputPath, quality);
                    break;
                case 'qpdf':
                    result = await this.compressWithQPdf(inputPath, outputPath, options);
                    break;
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }
            
            // Read compressed file
            const compressedBuffer = await fs.readFile(outputPath);
            
            // Cleanup temp files
            await this.cleanupFiles([inputPath, outputPath]);
            
            // Check if compression achieved target size
            const originalSize = inputBuffer.length;
            const compressedSize = compressedBuffer.length;
            const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
            
            // If file is still too large and we can try more aggressive compression
            if (compressedSize > maxSizeMB * 1024 * 1024 && quality !== 'screen') {
                console.log(`File still too large (${(compressedSize/1024/1024).toFixed(2)}MB), trying more aggressive compression...`);
                return await this.compress(inputBuffer, {
                    ...options,
                    quality: 'screen' // Most aggressive
                });
            }
            
            return {
                success: true,
                originalSize,
                compressedSize,
                reduction: `${reduction}%`,
                buffer: compressedBuffer,
                methodUsed: method
            };
            
        } catch (error) {
            // Cleanup on error
            await this.cleanupFiles([inputPath, outputPath]).catch(() => {});
            throw error;
        }
    }
    
    async cleanupFiles(filePaths) {
        const cleanupPromises = filePaths.map(async filePath => {
            try {
                await fs.unlink(filePath);
            } catch (error) {
                // Ignore errors if file doesn't exist
                if (error.code !== 'ENOENT') {
                    console.warn(`Failed to delete temp file ${filePath}:`, error.message);
                }
            }
        });
        
        await Promise.all(cleanupPromises);
    }
    
    async getPDFInfo(pdfBuffer) {
        const tempDir = './temp';
        await fs.mkdir(tempDir, { recursive: true });
        
        const timestamp = Date.now();
        const tempPath = path.join(tempDir, `info_${timestamp}.pdf`);
        
        try {
            await fs.writeFile(tempPath, pdfBuffer);
            
            // Use pdftk or qpdf to get PDF info
            const command = `qpdf --show-npages "${tempPath}"`;
            const { stdout } = await execPromise(command);
            
            const pageCount = parseInt(stdout.trim());
            
            // Get file size
            const stats = await fs.stat(tempPath);
            
            // Cleanup
            await fs.unlink(tempPath);
            
            return {
                pageCount: pageCount || 1,
                fileSize: stats.size,
                isValid: pageCount > 0
            };
            
        } catch (error) {
            await fs.unlink(tempPath).catch(() => {});
            
            // Fallback: try to parse with pdf-lib if available
            try {
                const { PDFDocument } = require('pdf-lib');
                const pdfDoc = await PDFDocument.load(pdfBuffer);
                return {
                    pageCount: pdfDoc.getPageCount(),
                    fileSize: pdfBuffer.length,
                    isValid: true
                };
            } catch (pdfLibError) {
                return {
                    pageCount: 1,
                    fileSize: pdfBuffer.length,
                    isValid: false,
                    error: 'Could not parse PDF'
                };
            }
        }
    }
    
    async mergePDFs(pdfBuffers) {
        try {
            const { PDFDocument } = require('pdf-lib');
            const mergedPdf = await PDFDocument.create();
            
            for (const pdfBuffer of pdfBuffers) {
                const pdf = await PDFDocument.load(pdfBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));
            }
            
            const mergedBuffer = await mergedPdf.save();
            return {
                success: true,
                buffer: mergedBuffer,
                pageCount: mergedPdf.getPageCount(),
                size: mergedBuffer.length
            };
            
        } catch (error) {
            throw new Error(`PDF merge failed: ${error.message}`);
        }
    }
    
    async splitPDF(pdfBuffer, options = {}) {
        try {
            const { PDFDocument } = require('pdf-lib');
            const pdf = await PDFDocument.load(pdfBuffer);
            const totalPages = pdf.getPageCount();
            
            const { 
                pageRanges = [`1-${totalPages}`], 
                individualPages = false 
            } = options;
            
            const results = [];
            
            if (individualPages) {
                // Split into individual pages
                for (let i = 0; i < totalPages; i++) {
                    const newPdf = await PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(pdf, [i]);
                    newPdf.addPage(copiedPage);
                    const pageBuffer = await newPdf.save();
                    
                    results.push({
                        pageNumber: i + 1,
                        buffer: pageBuffer,
                        size: pageBuffer.length
                    });
                }
            } else {
                // Split by ranges
                for (const range of pageRanges) {
                    const [startStr, endStr] = range.split('-');
                    const start = parseInt(startStr) - 1;
                    const end = endStr ? parseInt(endStr) - 1 : start;
                    
                    if (isNaN(start) || start < 0 || start >= totalPages) {
                        throw new Error(`Invalid page range: ${range}`);
                    }
                    
                    const newPdf = await PDFDocument.create();
                    const pageIndices = [];
                    
                    for (let i = start; i <= Math.min(end, totalPages - 1); i++) {
                        pageIndices.push(i);
                    }
                    
                    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
                    copiedPages.forEach(page => newPdf.addPage(page));
                    
                    const rangeBuffer = await newPdf.save();
                    
                    results.push({
                        range: range,
                        pages: pageIndices.length,
                        buffer: rangeBuffer,
                        size: rangeBuffer.length
                    });
                }
            }
            
            return {
                success: true,
                results: results,
                totalPages: totalPages
            };
            
        } catch (error) {
            throw new Error(`PDF split failed: ${error.message}`);
        }
    }
}

module.exports = PDFCompressor;