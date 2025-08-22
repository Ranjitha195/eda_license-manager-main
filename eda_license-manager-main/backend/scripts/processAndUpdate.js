const fs = require('fs');
const path = require('path');
const { LicenseParser } = require('../backend/licenseParser');

// Configuration
const INCOMING_DIR = path.join(__dirname, '..', 'incoming');
const PUBLIC_DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const parser = new LicenseParser();

// Ensure public data directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function processLicenseFiles() {
  try {
    const toolDirs = fs.readdirSync(INCOMING_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    let allLicenseData = [];
    const tools = new Set();

    for (const toolDir of toolDirs) {
      const toolPath = path.join(INCOMING_DIR, toolDir);
      const files = fs.readdirSync(toolPath);
      
      console.log(`\n📁 Processing tool: ${toolDir}`);
      
      for (const file of files) {
        if (file.endsWith('.txt') || !file.includes('.')) {
          const filePath = path.join(toolPath, file);
          console.log(`🔍 Processing: ${file}`);
          
          try {
            const data = parser.parseLicenseFile(filePath, toolDir);
            if (data && data.length > 0) {
              allLicenseData = [...allLicenseData, ...data];
              tools.add(toolDir);
              console.log(`✅ Found ${data.length} features`);
            }
          } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
          }
        }
      }
    }
    
    // Save the combined data
    if (allLicenseData.length > 0) {
      const outputFile = path.join(PUBLIC_DIR, 'licenses.json');
      fs.writeFileSync(outputFile, JSON.stringify(allLicenseData, null, 2));
      
      // Save tools list
      const toolsFile = path.join(PUBLIC_DIR, 'tools.json');
      fs.writeFileSync(toolsFile, JSON.stringify(Array.from(tools), null, 2));
      
      console.log(`\n🎉 Successfully processed ${allLicenseData.length} license features`);
      console.log(`📊 Data saved to: ${outputFile}`);
      console.log(`🛠️  Tools found: ${Array.from(tools).join(', ')}`);
    } else {
      console.log('\n⚠️  No license data was processed.');
    }
  } catch (error) {
    console.error('Error processing license files:', error);
  }
}

// Run the script
processLicenseFiles();
