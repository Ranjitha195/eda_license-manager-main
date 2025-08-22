const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

console.log('Starting simple server...');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Sample data endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Simple server is running' });
});

// Sample licenses endpoint
app.get('/api/licenses', (req, res) => {
  const sampleData = [
    {
      feature: "111",
      totalLicenses: 2580,
      inUse: 183,
      available: 2397,
      version: "23.1",
      expiry: "06-aug-2025",
      tool: "synopsys",
      users: []
    }
  ];
  
  res.json(sampleData);
});

// Start the server
const server = app.listen(port, '192.168.92.34', () => {
  console.log(`Simple server is running on http://192.168.92.34:${port}`);
  console.log('Endpoints:');
  console.log(`  GET /api/health - Health check`);
  console.log(`  GET /api/licenses - Sample license data`);
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please free the port or change the port number.`);
  }
  process.exit(1);
});
