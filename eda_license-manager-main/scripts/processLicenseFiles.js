const fs = require('fs');
const path = require('path');
const { LicenseParser } = require('../backend/licenseParser');

// Configuration
const INCOMING_DIR = path.join(__dirname, '..', 'incoming');
const OUTPUT_DIR = path.join(__dirname, '..', 'processed');
const parser = new LicenseParser();

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function processLicenseFile(filePath, toolName) {
  try {
    console.log(`🔍 Processing: ${filePath}`);
    const data = parser.parseLicenseFile(filePath, toolName);
    
    if (data && data.length > 0) {
      const outputFile = path.join(OUTPUT_DIR, `${toolName}_${Date.now()}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
      console.log(`✅ Successfully processed ${filePath}: ${data.length} features found`);
      console.log(`   Output saved to: ${outputFile}`);
      return data;
    } else {
      console.log(`⚠️  No valid license data found in: ${filePath}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return null;
  }
}

async function processIncomingDirectory() {
  try {
    const toolDirs = fs.readdirSync(INCOMING_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    let allLicenseData = [];

    for (const toolDir of toolDirs) {
      const toolPath = path.join(INCOMING_DIR, toolDir);
      const files = fs.readdirSync(toolPath);
      
      console.log(`\n📁 Processing tool: ${toolDir}`);
      
      for (const file of files) {
        if (file.endsWith('.txt') || !file.includes('.')) {
          const filePath = path.join(toolPath, file);
          const data = processLicenseFile(filePath, toolDir);
          if (data) {
            allLicenseData = [...allLicenseData, ...data];
          }
        }
      }
    }
    
    // Save all data to a single file
    if (allLicenseData.length > 0) {
      const combinedOutput = path.join(OUTPUT_DIR, 'all_licenses.json');
      fs.writeFileSync(combinedOutput, JSON.stringify(allLicenseData, null, 2));
      console.log(`\n🎉 Processed ${allLicenseData.length} total features across all tools`);
      console.log(`📊 Combined data saved to: ${combinedOutput}`);
    } else {
      console.log('\n⚠️  No license data was processed.');
    }
  } catch (error) {
    console.error('Error processing incoming directory:', error);
  }
}

// Run the script
processIncomingDirectory();
