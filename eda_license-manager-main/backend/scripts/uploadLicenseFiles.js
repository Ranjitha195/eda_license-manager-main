const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const BASE_URL = 'http://localhost:3001';
const INCOMING_DIR = path.join(__dirname, '..', 'incoming');

async function uploadLicenseFile(filePath, toolName) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('tool', toolName);

    const response = await axios.post(`${BASE_URL}/api/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log(`✅ Successfully processed ${filePath}:`, response.data.data.length, 'features found');
    return response.data;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.response?.data?.error || error.message);
    return null;
  }
}

async function processIncomingDirectory() {
  try {
    const toolDirs = fs.readdirSync(INCOMING_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const toolDir of toolDirs) {
      const toolPath = path.join(INCOMING_DIR, toolDir);
      const files = fs.readdirSync(toolPath);
      
      console.log(`\n📁 Processing tool: ${toolDir}`);
      
      for (const file of files) {
        if (file.endsWith('.txt') || !file.includes('.')) {
          const filePath = path.join(toolPath, file);
          console.log(`\n📄 Uploading file: ${file}`);
          await uploadLicenseFile(filePath, toolDir);
        }
      }
    }
    
    console.log('\n🎉 All files processed!');
  } catch (error) {
    console.error('Error processing incoming directory:', error);
  }
}

// Run the script
processIncomingDirectory();
