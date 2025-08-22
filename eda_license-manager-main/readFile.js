const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'incoming', 'synopsys');

console.log(`Attempting to read file: ${filePath}`);

try {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error('Error: File does not exist');
    
    // List contents of incoming directory
    const incomingDir = path.dirname(filePath);
    console.log('\nContents of incoming directory:');
    try {
      const files = fs.readdirSync(incomingDir);
      if (files.length === 0) {
        console.log('  (empty)');
      } else {
        files.forEach(file => {
          const fullPath = path.join(incomingDir, file);
          const stats = fs.statSync(fullPath);
          console.log(`  - ${file} (${stats.isDirectory() ? 'directory' : 'file'}, ${stats.size} bytes)`);
        });
      }
    } catch (e) {
      console.error('Error reading incoming directory:', e.message);
    }
    
    process.exit(1);
  }
  
  // Read file content
  console.log('File exists, reading content...');
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log('\nFirst 200 characters of file:');
  console.log('----------------------------------------');
  console.log(content.substring(0, 200));
  console.log('----------------------------------------');
  
  console.log('\nFile size:', content.length, 'characters');
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
