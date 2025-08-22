import React, { useRef, useState } from 'react';
import './ToolFilter.css';

const ToolFilter = ({ 
  tools, 
  selectedTool, 
  onToolChange, 
  selectedExpiryStatus, 
  onExpiryStatusChange,
  onFileUpload,
  onDeleteTool
}) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const expiryStatusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'valid', label: 'Valid' },
    { value: 'expiring-soon', label: 'Expiring Soon (30 days)' },
    { value: 'expired', label: 'Expired' }
  ];

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes('text/plain') && !file.name.endsWith('.txt')) {
      alert('Please upload a .txt file');
      resetFileInput();
      return;
    }

    setFileName(file.name);
    
    if (onFileUpload) {
      try {
        await onFileUpload({
          name: file.name,
          type: file.type,
          size: file.size,
          rawFile: file,
          lastModified: file.lastModified
        });
        // Reset file input on successful upload
        resetFileInput();
      } catch (error) {
        console.error('Error handling file upload:', error);
        // Error is already handled in the onFileUpload function
        resetFileInput();
      }
    } else {
      resetFileInput();
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const resetFileInput = () => {
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="filter-container">
      <div className="tool-filter">
        <label htmlFor="tool-select" className="filter-label">
          Select EDA Tool:
        </label>
        <div className="tool-select-wrapper">
          <select
            id="tool-select"
            value={selectedTool}
            onChange={(e) => onToolChange(e.target.value)}
            className="tool-select"
          >
            {tools.map((tool) => (
              <option key={tool} value={tool}>
                {tool === 'all' ? 'All Tools' : tool.charAt(0).toUpperCase() + tool.slice(1)}
              </option>
            ))}
          </select>
          {selectedTool !== 'all' && (
            <button 
              onClick={() => onDeleteTool(selectedTool)}
              className="delete-tool-button"
              title={`Delete all license files for ${selectedTool}`}
            >
              Delete Tool
            </button>
          )}
        </div>
      </div>

      <div className="expiry-filter">
        <label htmlFor="expiry-select" className="filter-label">
          Expiry Status:
        </label>
        <select
          id="expiry-select"
          value={selectedExpiryStatus}
          onChange={(e) => onExpiryStatusChange(e.target.value)}
          className="expiry-select"
        >
          {expiryStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        </div>

        <div className="upload-container">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="file-input"
            style={{ display: 'none' }}
            accept=".txt"  // Accept only text files
          />
          <button 
            onClick={handleButtonClick}
            className="upload-button"
            title="Upload license file"
          >
            Upload License File
          </button>
          {fileName && (
            <span className="file-name" title={fileName}>
              {fileName.length > 15 ? `${fileName.substring(0, 15)}...` : fileName}
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export default ToolFilter;
