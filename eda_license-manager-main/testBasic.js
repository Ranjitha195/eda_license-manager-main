const fs = require('fs');
const path = require('path');

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Try to create a test file in the current directory
const testFilePath = path.join(__dirname, 'test.txt');
try {
    console.log('\nTrying to create a test file...');
    fs.writeFileSync(testFilePath, 'This is a test file');
    console.log('✅ Successfully created test file');
    
    // Try to read it back
    const content = fs.readFileSync(testFilePath, 'utf8');
    console.log('✅ Successfully read test file');
    console.log('File content:', content);
    
    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('✅ Cleaned up test file');
} catch (error) {
    console.error('❌ Error:', error.message);
}

// Try to list the current directory
try {
    console.log('\nContents of current directory:');
    const files = fs.readdirSync(__dirname);
    files.forEach((file, index) => {
        const filePath = path.join(__dirname, file);
        try {
            const stats = fs.statSync(filePath);
            console.log(`${index + 1}. ${file} (${stats.isDirectory() ? 'dir' : 'file'}, ${stats.size} bytes)`);
        } catch (e) {
            console.log(`${index + 1}. ${file} (error: ${e.message})`);
        }
    });
} catch (error) {
    console.error('Error listing directory:', error.message);
}
