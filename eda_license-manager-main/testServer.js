const http = require('http');

const port = 3001;

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'success', 
    message: 'Test server is working',
    timestamp: new Date().toISOString()
  }));
});

server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
  }
  process.exit(1);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Test server running at http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop the server');
  
  // Test the server
  const http = require('http');
  const testReq = http.get(`http://localhost:${port}`, (testRes) => {
    let data = '';
    testRes.on('data', (chunk) => { data += chunk; });
    testRes.on('end', () => {
      console.log('\nTest request response:');
      console.log(`Status: ${testRes.statusCode}`);
      console.log('Headers:', JSON.stringify(testRes.headers, null, 2));
      console.log('Body:', data);
      
      // Close the server after test
      server.close(() => {
        console.log('\nTest server closed');
      });
    });
  });
  
  testReq.on('error', (e) => {
    console.error('Test request failed:', e);
    server.close();
  });
});
