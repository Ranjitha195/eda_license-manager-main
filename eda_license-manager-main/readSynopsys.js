const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'incoming', 'synopsys');

try {
    console.log(`Reading file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('File content:');
    console.log('-------------------');
    console.log(content.substring(0, 1000)); // Show first 1000 chars
    console.log('-------------------');
    console.log(`File size: ${content.length} characters`);
} catch (error) {
    console.error('Error reading file:', error);
}
