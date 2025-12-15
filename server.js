// server.js - FileOptimizer Pro Backend Server
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
    // Log request
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Parse URL
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // API endpoints
    if (pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'online',
            service: 'FileOptimizer Pro',
            version: '2.0',
            timestamp: new Date().toISOString(),
            message: 'All file processing happens client-side for privacy'
        }));
        return;
    }
    
    if (pathname === '/api/info') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            name: 'FileOptimizer Pro',
            description: 'Free online file optimization suite',
            features: [
                'File Conversion',
                'Image Resizing & Compression',
                'Batch Processing (100+ files)',
                'PDF Tools',
                'QR Code Scanner & Generator',
                'Text Extraction (OCR)',
                'Social Media Presets'
            ],
            limits: {
                maxFiles: 100,
                maxFileSize: '50MB',
                maxTotalSize: '500MB',
                privacy: '100% client-side processing'
            },
            themes: ['dark', 'light', 'blue'],
            supportedFormats: {
                images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
                documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'],
                archives: ['zip', 'rar', '7z', 'tar', 'gz']
            }
        }));
        return;
    }
    
    // Serve static files
    const filePath = path.join(__dirname, pathname);
    const extname = path.extname(filePath);
    let contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Check if file exists
    fs.exists(filePath, (exists) => {
        if (!exists) {
            // If file doesn't exist, try .html extension
            if (pathname.includes('.')) {
                // File with extension not found
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            
            // Try with .html extension
            const htmlPath = filePath + '.html';
            fs.exists(htmlPath, (htmlExists) => {
                if (htmlExists) {
                    serveFile(htmlPath, 'text/html', res);
                } else {
                    // Serve 404 page or redirect to index
                    const indexPath = path.join(__dirname, 'index.html');
                    serveFile(indexPath, 'text/html', res);
                }
            });
            return;
        }
        
        // Serve the file
        serveFile(filePath, contentType, res);
    });
});

function serveFile(filePath, contentType, res) {
    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(500);
            res.end(`Server Error: ${error.code}`);
            return;
        }
        
        // Set CORS headers for API responses
        if (filePath.includes('/api/')) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
    });
}

// Start server
server.listen(PORT, () => {
    console.log(`
    🚀 FILEOPTIMIZER PRO SERVER v2.0
    =================================
    
    ✅ Server running: http://localhost:${PORT}
    ✅ Health check:   http://localhost:${PORT}/api/health
    ✅ Server info:    http://localhost:${PORT}/api/info
    
    📁 AVAILABLE TOOLS:
    • Homepage:        http://localhost:${PORT}/
    • File Converter:  http://localhost:${PORT}/file-converter.html
    • Image Resizer:   http://localhost:${PORT}/image-resizer.html
    • Batch Processor: http://localhost:${PORT}/batch-process.html
    • PDF Tools:       http://localhost:${PORT}/pdf-tools.html
    • QR Scanner:      http://localhost:${PORT}/qr-scanner.html
    • Text Extractor:  http://localhost:${PORT}/text-extractor.html
    • Social Presets:  http://localhost:${PORT}/social-presets.html
    • About:           http://localhost:${PORT}/about.html
    • Contact:         http://localhost:${PORT}/contact.html
    
    🛡️ IMPORTANT:
    • All file processing happens in browser
    • No files are uploaded to server
    • 100% privacy guaranteed
    
    💡 FEATURES:
    • Dark/Light/Blue themes (click theme button)
    • Drag & drop anywhere
    • Batch processing (100+ files)
    • Responsive design
    
    Press Ctrl+C to stop server
    =================================
    `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down FileOptimizer Pro server...');
    server.close(() => {
        console.log('✅ Server stopped successfully');
        process.exit(0);
    });
});