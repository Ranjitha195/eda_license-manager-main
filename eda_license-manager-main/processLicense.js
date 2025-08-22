const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = path.join(__dirname, 'incoming', 'synopsys');
const OUTPUT_FILE = path.join(__dirname, 'frontend', 'public', 'licenses.json');

function parseLicenseFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const features = [];
        
        let currentFeature = null;
        let version = '';
        let expiry = '';
        let inUserSection = false;
        let users = [];

        // First pass: Extract version and expiry
        for (const line of lines) {
            const versionMatch = line.match(/"([^"]+)"\s+v([\d.]+)/);
            if (versionMatch) version = versionMatch[2];
            
            const expiryMatch = line.match(/expiry:\s*([^\s,]+)/i);
            if (expiryMatch) expiry = expiryMatch[1];
        }

        // Second pass: Process features and users
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) continue;
            
            // Look for feature line
            const featureMatch = line.match(/Users of ([^:]+):\s*\(Total of (\d+) license[s]? issued;\s*Total of (\d+) license[s]? in use\)/i);
            
            if (featureMatch) {
                // Save previous feature
                if (currentFeature) {
                    currentFeature.users = [...new Set(users)]; // Remove duplicates
                    features.push(currentFeature);
                }
                
                // Create new feature
                currentFeature = {
                    feature: featureMatch[1].trim(),
                    totalLicenses: parseInt(featureMatch[2]),
                    inUse: parseInt(featureMatch[3]),
                    available: parseInt(featureMatch[2]) - parseInt(featureMatch[3]),
                    version: version,
                    expiry: expiry,
                    tool: 'synopsys',
                    users: []
                };
                
                users = [];
                inUserSection = true;
                continue;
            }
            
            // Look for user lines (lines with usernames and host information)
            if (currentFeature && inUserSection) {
                // This is a simple pattern - you might need to adjust it based on actual user line format
                const userMatch = line.match(/^\s*([^\s@]+)@([^\s:]+)/);
                if (userMatch) {
                    const username = userMatch[1];
                    const host = userMatch[2];
                    users.push(username);
                }
            }
            
            // If we hit a line that indicates the end of user section
            if (line.includes('Users of')) {
                inUserSection = false;
            }
        }
        
        // Add the last feature
        if (currentFeature) {
            currentFeature.users = [...new Set(users)]; // Remove duplicates
            features.push(currentFeature);
        }
        
        return features;
    } catch (error) {
        console.error('Error parsing license file:', error);
        return [];
    }
}

// Process the file
console.log('Processing license file...');
const features = parseLicenseFile(INPUT_FILE);

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Save the results
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(features, null, 2));

console.log(`✅ Processed ${features.length} features`);
console.log(`📊 Data saved to: ${OUTPUT_FILE}`);

// Print summary
console.log('\nSummary:');
features.forEach((feature, index) => {
    console.log(`\n${index + 1}. ${feature.feature}`);
    console.log(`   Total Licenses: ${feature.totalLicenses}`);
    console.log(`   In Use: ${feature.inUse}`);
    console.log(`   Available: ${feature.available}`);
    console.log(`   Version: ${feature.version}`);
    console.log(`   Expiry: ${feature.expiry}`);
    console.log(`   Users (${feature.users.length}): ${feature.users.join(', ')}`);
});
