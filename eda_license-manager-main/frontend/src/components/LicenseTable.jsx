import React, { useState } from 'react';
import axios from 'axios';
import './LicenseTable.css';
import FeatureDetailsModal from './FeatureDetailsModal';

const LicenseTable = ({ data, loading, selectedTool }) => {
  console.log('LicenseTable rendered with props:', {
    dataLength: data?.length,
    loading,
    selectedTool,
    firstItem: data?.[0]
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [featureData, setFeatureData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  if (loading) {
    console.log('LicenseTable: Loading state');
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading license data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    console.log('LicenseTable: No data available', { data, loading, selectedTool });
    return (
      <div className="no-data">
        <h3>No license data found</h3>
        <p>
          {selectedTool === 'all' 
            ? 'No license files have been processed yet.' 
            : `No data found for ${selectedTool}.`}
        </p>
      </div>
    );
  }

  const formatUsers = (users) => {
    if (!users || users.length === 0) return 'None';
    if (users.length <= 3) return users.join(', ');
    return `${users.slice(0, 3).join(', ')} (+${users.length - 3} more)`;
  };

  const getStatusClass = (inUse, total) => {
    const percentage = (inUse / total) * 100;
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'normal';
  };

  const getExpiryStatusClass = (expiry) => {
    if (!expiry || expiry === 'N/A') return 'valid';
    
    try {
      const parts = expiry.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const monthStr = parts[1].toLowerCase();
        const year = parseInt(parts[2]);
        
        const monthMap = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        
        const month = monthMap[monthStr];
        if (month !== undefined) {
          const expiryDate = new Date(year, month, day);
          expiryDate.setHours(23, 59, 59, 999);
          
          const now = new Date();
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(now.getDate() + 30);
          
          if (expiryDate <= now) return 'expired';
          if (expiryDate <= thirtyDaysFromNow) return 'expiring-soon';
          return 'valid';
        }
      }
    } catch (error) {
      console.error('Error parsing expiry date:', expiry, error);
    }
    
    return 'valid';
  };

  const handleFeatureClick = async (feature, tool) => {
    try {
      console.log('Opening modal for feature:', feature, 'tool:', tool);
      console.log('Current modal state before:', { modalOpen, modalLoading, modalError, featureData });
      
      setModalOpen(true);
      setModalLoading(true);
      setModalError(null);
      setFeatureData(null);
      
      console.log('Modal state set to open');

      // First check if backend is accessible
      try {
        const healthCheck = await axios.get('/api/health');
        console.log('Backend health check:', healthCheck.data);
      } catch (healthError) {
        console.error('Backend not accessible:', healthError);
        setModalError('Backend server is not running. Please start the backend server.');
        setModalLoading(false);
        return;
      }

      const url = `/api/feature/${tool}/${encodeURIComponent(feature)}`;
      console.log('Making API call to:', url);
      
      const response = await axios.get(url);
      console.log('API response:', response.data);
      
      if (response.data.success) {
        setFeatureData(response.data.data);
        console.log('Feature data set:', response.data.data);
        console.log('Modal should now be visible with data');
      } else {
        setModalError('Failed to load feature details');
        console.log('API returned error:', response.data);
      }
    } catch (error) {
      console.error('Error fetching feature details:', error);
      setModalError('Failed to load feature details: ' + error.message);
    } finally {
      setModalLoading(false);
      console.log('Loading finished, modal state:', { modalOpen, modalLoading, modalError, featureData: !!featureData });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setFeatureData(null);
    setModalError(null);
  };

  return (
    <div className="license-table-container">
      <div className="table-header">
        <h2>License Usage Overview</h2>
        <div className="summary">
          <span className="tool-name">
            {selectedTool === 'all' ? 'All Tools' : selectedTool.toUpperCase()}
          </span>
          <span className="total-features">
            {data.length} feature{data.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="license-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Version</th>
              <th>Expiry</th>
              <th>Total Licenses</th>
              <th>In Use</th>
              <th>Available</th>
              <th>User Count</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className={`${getStatusClass(item.inUse, item.totalLicenses)} ${getExpiryStatusClass(item.expiry)}`}>
                <td 
                  className="feature-cell clickable"
                  onClick={() => handleFeatureClick(item.feature, item.tool)}
                  title="Click to view detailed user information"
                >
                  {item.feature}
                  <span className="click-indicator">👁️</span>
                </td>
                <td className="version-cell">{item.version || 'N/A'}</td>
                <td className="expiry-cell">{item.expiry || 'N/A'}</td>
                <td className="total-cell">{item.totalLicenses}</td>
                <td
                  className="usage-cell clickable"
                  onClick={() => handleFeatureClick(item.feature, item.tool)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFeatureClick(item.feature, item.tool); } }}
                  title="Click to view current users and session details"
                  role="button"
                  tabIndex={0}
                >
                  <div className="usage-info">
                    <span className="usage-number">{item.inUse}</span>
                    <div className="usage-bar">
                      <div 
                        className="usage-fill"
                        style={{ 
                          width: `${(item.inUse / item.totalLicenses) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="available-cell">{item.available}</td>
                <td className="user-count-cell">
                  <span className="user-count-badge">
                    {item.users?.length || 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <FeatureDetailsModal
        isOpen={modalOpen}
        onClose={closeModal}
        featureData={featureData}
        loading={modalLoading}
        error={modalError}
      />
    </div>
  );
};

export default LicenseTable;
