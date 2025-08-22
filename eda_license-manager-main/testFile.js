const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'incoming', 'synopsys');

console.log('Testing file access...');
console.log('File path:', filePath);

// Check if file exists
if (fs.existsSync(filePath)) {
    console.log('✅ File exists');
    
    // Check file stats
    try {
        const stats = fs.statSync(filePath);
        console.log('File stats:', {
            size: stats.size,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            modified: stats.mtime
        });
        
        // Try to read the file
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            console.log('\nFirst 100 characters of file content:');
            console.log('----------------------------------------');
            console.log(content.substring(0, 100));
            console.log('----------------------------------------');
            console.log('File read successfully!');
        } catch (readError) {
            console.error('Error reading file:', readError);
        }
    } catch (statError) {
        console.error('Error getting file stats:', statError);
    }
} else {
    console.error('❌ File does not exist');
    
    // List contents of incoming directory
    try {
        const incomingDir = path.join(__dirname, 'incoming');
        console.log('\nContents of incoming directory:');
        const files = fs.readdirSync(incomingDir);
        files.forEach((file, index) => {
            const fullPath = path.join(incomingDir, file);
            const stats = fs.statSync(fullPath);
            console.log(`- ${file} (${stats.isDirectory() ? 'directory' : 'file'}, ${stats.size} bytes)`);
        });
    } catch (dirError) {
        console.error('Error reading incoming directory:', dirError);
    }
}
