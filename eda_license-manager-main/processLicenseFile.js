const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = path.join(__dirname, 'incoming', 'synopsys');
const OUTPUT_FILE = path.join(__dirname, 'frontend', 'public', 'licenses.json');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Sample data structure we want to create
const sampleOutput = [
    {
        "feature": "111",
        "totalLicenses": 2580,
        "inUse": 183,
        "available": 2397,
        "version": "23.1",
        "expiry": "06-aug-2025",
        "tool": "synopsys",
        "users": []
    },
    // ... more features
];

// Create the sample output
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sampleOutput, null, 2));
console.log(`✅ Created sample output with 1 feature`);
console.log(`📊 Data saved to: ${OUTPUT_FILE}`);
