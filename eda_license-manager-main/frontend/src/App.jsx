import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import LicenseTable from './components/LicenseTable';
import ToolFilter from './components/ToolFilter';
import LicenseCharts from './components/LicenseCharts';
// import path from 'path'; // Removed: Added for path.basename

// Configure axios base URL for development
if (process.env.NODE_ENV === 'development') {
  axios.defaults.baseURL = 'http://localhost:3001';
}

function App() {
  const [licenseData, setLicenseData] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState('all');
  const [selectedExpiryStatus, setSelectedExpiryStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadMessage, setUploadMessage] = useState(null); // New state for upload messages
  const [deleteConfirmTool, setDeleteConfirmTool] = useState(null); // New state for delete confirmation

  // Effect to clear upload or error messages after a delay
  useEffect(() => {
    let timer;
    if (uploadMessage) {
      timer = setTimeout(() => {
        setUploadMessage(null);
      }, 5000); // 5 seconds
    } else if (error) {
      timer = setTimeout(() => {
        setError(null);
      }, 5000); // 5 seconds
    } else if (deleteConfirmTool) { // Clear delete confirmation message
      timer = setTimeout(() => {
        setDeleteConfirmTool(null);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [uploadMessage, error, deleteConfirmTool]);

  // const [toolFiles, setToolFiles] = useState([]); // Removed: New state for individual tool files

  // Fetch available tools and test backend connection
  useEffect(() => {
    fetchTools();
    
    // Test backend connection
    const testBackend = async () => {
      try {
        const response = await axios.get('/api/health');
        console.log('Backend connection test:', response.data);
      } catch (err) {
        console.error('Backend connection test failed:', err);
      }
    };
    
    testBackend();
  }, []);

  // Fetch license data when tool selection changes
  useEffect(() => {
    console.log('Selected tool changed to:', selectedTool);
    fetchLicenseData();
    // if (selectedTool !== 'all') {
    //   fetchToolFiles(selectedTool);
    // } else {
    //   setToolFiles([]); // Clear files when 'All Tools' is selected
    // }
  }, [selectedTool]);

  const fetchTools = async () => {
    try {
      const response = await axios.get('/api/tools');
      if (response.data.success) {
        setAvailableTools(['all', ...response.data.tools]);
      }
    } catch (err) {
      console.error('Error fetching tools:', err);
      setError('Failed to fetch available tools');
    }
  };

  // Removed: const fetchToolFiles = async (toolName) => { ... }

  const fetchLicenseData = async () => {
    try {
      setLoading(true);
      const url = selectedTool === 'all' 
        ? '/api/licenses' 
        : `/api/licenses?tool=${selectedTool}`;
      
      console.log('Fetching license data from:', url);
      const response = await axios.get(url);
      
      // Log complete response for debugging
      console.log('Complete API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        console.log('Setting license data with', response.data.data.length, 'items');
        console.log('First item sample:', JSON.stringify(response.data.data[0], null, 2));
        setLicenseData(response.data.data);
      } else {
        console.error('API returned success: false', response.data);
      }
    } catch (err) {
      console.error('Error fetching license data:', err);
      setError('Failed to fetch license data');
    } finally {
      setLoading(false);
    }
  };

  const handleToolChange = (tool) => {
    setSelectedTool(tool);
  };

  const handleExpiryStatusChange = (status) => {
    setSelectedExpiryStatus(status);
  };

  const handleFileUpload = async (fileInfo) => {
    try {
      setLoading(true);
      setError(null);
      setUploadMessage(null); // Clear previous messages
      
      // Basic validation
      if (!fileInfo.rawFile) {
        throw new Error('No file selected');
      }

      // Get tool name from filename (without extension)
      const toolName = fileInfo.name.replace(/\.[^/.]+$/, '').toLowerCase();
      
      // Create FormData and append file
      const formData = new FormData();
      formData.append('file', fileInfo.rawFile);
      formData.append('tool', toolName);

      console.log(`Uploading file: ${fileInfo.name} as tool: ${toolName} (${(fileInfo.size / 1024).toFixed(2)} KB)`);
      
      // Show upload progress
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      };

      const response = await axios.post('/api/upload', formData, config);
      console.log('Upload response:', response.data);

      if (response.data.success) {
        // If we got data back, update the state
        if (response.data.data && response.data.data.length > 0) {
          // Add source file info to each feature
          const featuresWithSource = response.data.data.map(feature => ({
            ...feature,
            sourceFile: fileInfo.name,
            uploadTime: new Date().toISOString(),
            tool: toolName // Ensure tool name is set
          }));
          
          // Update available tools with the new tool name if it doesn't exist
          setAvailableTools(prevTools => {
            const toolsSet = new Set(prevTools);
            if (!toolsSet.has(toolName)) {
              return [...prevTools, toolName];
            }
            return prevTools;
          });
          
          // Set the selected tool to the newly uploaded one
          setSelectedTool(toolName);
          
          // Update license data
          setLicenseData(prevData => [...prevData, ...featuresWithSource]);
          
          // Set upload message based on duplicate flag
          // if (response.data.isDuplicate) {
          //   setUploadMessage(`⚠️ File "${fileInfo.name}" already exists. Uploaded as "${response.data.targetFileName}".`);
          // } else {
            setUploadMessage(`✅ Successfully processed ${response.data.data.length} license features from "${fileInfo.name}".`);
          // }
          
          // Refresh the data to include any other changes
          fetchLicenseData();
        } else {
          throw new Error('No valid license data found in the file');
        }
      } else {
        throw new Error(response.data.error || 'Failed to process license file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      let errorMessage = error.response?.data?.error || error.message || 'Failed to process license file';
      
      if (error.response && error.response.status === 409) {
        errorMessage = `❌ This file already exists: "${fileInfo.name}".`;
        setUploadMessage(errorMessage); // Set the specific message
        setError(null); // Clear general error if it's a duplicate specific message
      } else {
        setError(errorMessage);
        setUploadMessage(null); // Clear message on error
        alert(`❌ Error: ${errorMessage}`);
      }
      
      throw error; // Re-throw to be caught by the caller
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTool = async (toolToDelete) => {
    // Show confirmation message instead of alert
    setDeleteConfirmTool(toolToDelete);
  };

  const confirmDeleteTool = async () => {
    const toolToDelete = deleteConfirmTool; // Get the tool name from state
    setDeleteConfirmTool(null); // Clear the confirmation message immediately

    if (!toolToDelete) return; // Should not happen if button is correctly disabled

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Deleting tool: ${toolToDelete}`);
      const response = await axios.delete(`/api/tool/${toolToDelete}`);
      
      if (response.data.success) {
        setUploadMessage(`✅ ${response.data.message}`); // Use uploadMessage for success feedback
        setSelectedTool('all'); // Reset selected tool to 'all' after deletion
        fetchTools(); // Refresh available tools
        fetchLicenseData(); // Refresh license data
      } else {
        throw new Error(response.data.error || 'Failed to delete tool');
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete tool';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on expiry status
  const getFilteredData = () => {
    console.log('Filtering data. Current licenseData length:', licenseData.length);
    console.log('Selected expiry status:', selectedExpiryStatus);
    
    if (selectedExpiryStatus === 'all') {
      console.log('Returning all', licenseData.length, 'items');
      return licenseData;
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return licenseData.filter(item => {
      if (!item.expiry || item.expiry === 'N/A') {
        return selectedExpiryStatus === 'valid'; // Treat N/A as valid
      }

      // Parse expiry date - format is like "06-aug-2025"
      let expiryDate;
      try {
        const parts = item.expiry.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const monthStr = parts[1].toLowerCase();
          const year = parseInt(parts[2]);
          
          // Convert month string to number
          const monthMap = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
          };
          
          const month = monthMap[monthStr];
          if (month !== undefined) {
            expiryDate = new Date(year, month, day);
            // Set time to end of day for accurate comparison
            expiryDate.setHours(23, 59, 59, 999);
          } else {
            console.warn('Invalid month in expiry date:', item.expiry);
            return selectedExpiryStatus === 'valid';
          }
        } else {
          console.warn('Invalid expiry date format:', item.expiry);
          return selectedExpiryStatus === 'valid';
        }
      } catch (error) {
        console.error('Error parsing expiry date:', item.expiry, error);
        return selectedExpiryStatus === 'valid';
      }

      // Debug logging
      console.log(`License: ${item.feature}, Expiry: ${item.expiry}, Parsed: ${expiryDate}, Now: ${now}`);
      
      switch (selectedExpiryStatus) {
        case 'valid':
          const isValid = expiryDate > thirtyDaysFromNow;
          console.log(`Valid check: ${isValid} (${expiryDate} > ${thirtyDaysFromNow})`);
          return isValid;
        case 'expiring-soon':
          const isExpiringSoon = expiryDate <= thirtyDaysFromNow && expiryDate > now;
          console.log(`Expiring soon check: ${isExpiringSoon} (${expiryDate} <= ${thirtyDaysFromNow} && ${expiryDate} > ${now})`);
          return isExpiringSoon;
        case 'expired':
          const isExpired = expiryDate <= now;
          console.log(`Expired check: ${isExpired} (${expiryDate} <= ${now})`);
          return isExpired;
        default:
          return true;
      }
    });
  };

  // Background file monitoring (hidden from UI)
  useEffect(() => {
    const checkForChanges = async () => {
      try {
        const response = await axios.get('/api/check-changes');
        if (response.data.success && response.data.hasChanges) {
          console.log('File changes detected, refreshing data...');
          fetchTools();
          fetchLicenseData();
        }
      } catch (err) {
        console.error('Error checking for file changes:', err);
      }
    };

    // Check for changes every 5 seconds (background process)
    const interval = setInterval(checkForChanges, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredData = getFilteredData();
  console.log('Filtered data length:', filteredData.length);
  if (filteredData.length > 0) {
    console.log('First filtered item:', filteredData[0]);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>EDA License Manager</h1>
          <p>Monitor and manage EDA tool licenses</p>
        </div>
      </header>

      <main className="app-main">
        <div className="controls-section">
          <ToolFilter
            tools={availableTools}
            selectedTool={selectedTool}
            onToolChange={handleToolChange}
            selectedExpiryStatus={selectedExpiryStatus}
            onExpiryStatusChange={handleExpiryStatusChange}
            onFileUpload={handleFileUpload}
            onDeleteTool={handleDeleteTool}
            // toolFiles={toolFiles} // Removed: Pass individual tool files
            // onDeleteFile={handleDeleteSpecificFile} // Removed: Pass individual file delete handler
          />
        </div>

        {error && (
          <div className="message-card error">
            {error}
          </div>
        )}

        {uploadMessage && (
          <div className="message-card success">
            {uploadMessage}
          </div>
        )}

        {deleteConfirmTool && (
          <div className="message-card warning">
            <p>Are you sure you want to delete all license files for "{deleteConfirmTool}"?</p>
            <div className="message-actions">
              <button onClick={confirmDeleteTool} className="confirm-button">Yes, Delete</button>
              <button onClick={() => setDeleteConfirmTool(null)} className="cancel-button">No, Cancel</button>
            </div>
          </div>
        )}

        {/* Charts section */}
        <div className="table-section" style={{ marginBottom: '2rem' }}>
          <LicenseCharts data={filteredData} selectedTool={selectedTool} />
        </div>

        <div className="table-section">
          <LicenseTable 
            data={filteredData}
            loading={loading}
            selectedTool={selectedTool}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
