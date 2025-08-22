const fs = require('fs');
const path = require('path');

const incomingDir = path.join(__dirname, 'incoming');
console.log(`Checking directory: ${incomingDir}`);

try {
  // Check if directory exists
  if (!fs.existsSync(incomingDir)) {
    console.error('Error: incoming directory does not exist');
    process.exit(1);
  }
  
  // List directory contents
  const files = fs.readdirSync(incomingDir);
  console.log(`\nFound ${files.length} items in incoming directory:`);
  
  if (files.length === 0) {
    console.log('  (empty)');
  } else {
    files.forEach((file, index) => {
      const filePath = path.join(incomingDir, file);
      try {
        const stats = fs.statSync(filePath);
        const fileType = stats.isDirectory() ? 'Directory' : 'File';
        const fileSize = (stats.size / 1024).toFixed(2) + ' KB';
        
        console.log(`\n${index + 1}. ${file} (${fileType}, ${fileSize})`);
        
        // Show first few lines for files
        if (stats.isFile()) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            console.log('   First 3 lines:');
            content.split('\n').slice(0, 3).forEach((line, i) => {
              console.log(`   ${i + 1}. ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
            });
          } catch (e) {
            console.log('   Could not read file content:', e.message);
          }
        }
      } catch (e) {
        console.error(`Error processing ${file}:`, e.message);
      }
    });
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
