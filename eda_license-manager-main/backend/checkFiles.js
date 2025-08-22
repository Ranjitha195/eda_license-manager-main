const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'incoming');

console.log('Checking files in:', inputDir);

try {
  // List all files in the directory
  const files = fs.readdirSync(inputDir);
  
  if (files.length === 0) {
    console.log('No files found in the incoming directory');
    process.exit(0);
  }
  
  console.log(`\nFound ${files.length} files:\n`);
  
  // Display information about each file
  files.forEach((file, index) => {
    const filePath = path.join(inputDir, file);
    try {
      const stats = fs.statSync(filePath);
      const fileType = stats.isDirectory() ? 'Directory' : 'File';
      const fileSize = (stats.size / 1024).toFixed(2) + ' KB';
      
      console.log(`${index + 1}. ${file}`);
      console.log(`   Type: ${fileType}`);
      console.log(`   Size: ${fileSize}`);
      
      // If it's a file, show first few lines
      if (stats.isFile()) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n').slice(0, 5);
          console.log('   First few lines:');
          lines.forEach((line, i) => console.log(`   ${i + 1}. ${line.trim()}`));
        } catch (e) {
          console.log('   Could not read file content:', e.message);
        }
      }
      
      console.log('');
    } catch (e) {
      console.log(`Error processing ${file}:`, e.message);
    }
  });
  
} catch (error) {
  console.error('Error reading directory:', error);
}
