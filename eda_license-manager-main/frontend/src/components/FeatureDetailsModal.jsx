import React from 'react';
import './FeatureDetailsModal.css';

const FeatureDetailsModal = ({ isOpen, onClose, featureData, loading, error }) => {
  console.log('Modal props:', { isOpen, featureData, loading, error });
  
  // Scroll to top when modal opens
  React.useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen]);
  
  if (!isOpen) {
    console.log('Modal not open, returning null');
    return null;
  }
  
  console.log('Modal is open, rendering content');

  const formatStartTime = (startTime) => {
    if (!startTime || startTime === 'N/A') return 'N/A';
    
    // Expected format from backend: "Day Mon/Day HH:MM" (e.g., "Thu 6/26 16:12")
    try {
      const parts = startTime.trim().split(/\s+|\/|:/); // Split by space, /, or :

      if (parts.length >= 5) {
        // Example: ['Thu', '6', '26', '16', '12']
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const day = parseInt(parts[2]);
        const hours = parseInt(parts[3]);
        const minutes = parseInt(parts[4]);
        const currentYear = new Date().getFullYear(); // Assume current year

        const date = new Date(currentYear, month, day, hours, minutes);

        // Format for display: e.g., "Jul 26, 2:12 PM"
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (error) {
      console.error('Error formatting start time:', error);
    }
    return 'N/A'; // Fallback to N/A if parsing fails
  };

  const calculateSessionDuration = (startTime) => {
    if (!startTime || startTime === 'N/A') return 'N/A';
    
    try {
      // Expected format from backend: "Day Mon/Day HH:MM" (e.g., "Thu 6/26 16:12")
      const parts = startTime.trim().split(/\s+|\/|:/); // Split by space, /, or :

      if (parts.length >= 5) {
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const day = parseInt(parts[2]);
        const hours = parseInt(parts[3]);
        const minutes = parseInt(parts[4]);
        const currentYear = new Date().getFullYear();

        const startDate = new Date(currentYear, month, day, hours, minutes);
        const now = new Date();
        
        const durationMs = now - startDate;
        
        // Convert milliseconds to days, hours, and minutes
        const totalMinutes = Math.floor(durationMs / (1000 * 60));
        const days = Math.floor(totalMinutes / (24 * 60));
        const remainingMinutesAfterDays = totalMinutes % (24 * 60);
        const sessionHours = Math.floor(remainingMinutesAfterDays / 60); // Renamed from 'hours'
        const sessionMinutes = remainingMinutesAfterDays % 60; // Renamed from 'minutes'
        
        let durationString = '';
        if (days > 0) {
          durationString += `${days}d `;
        }
        if (sessionHours > 0) { // Use renamed variable
          durationString += `${sessionHours}h `;
        }
        if (sessionMinutes > 0 || (days === 0 && sessionHours === 0)) { // Show minutes if it's the only unit or if duration is less than an hour
          durationString += `${sessionMinutes}m`;
        }
        
        return durationString.trim();
      }
      return 'N/A';
    } catch (error) {
      console.error('Error calculating session duration:', error);
      return 'N/A';
    }
  };

  const getUsageCountClass = (count) => {
    return count > 1 ? 'high-usage' : 'normal-usage';
  };

  const formatVersion = (version) => {
    if (!version || version === 'N/A') return 'N/A';
    return version;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp || timestamp === 'N/A') return 'N/A';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return timestamp;
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        overflow: 'auto',
        padding: '20px'
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '1200px',
          overflow: 'hidden'
        }}
      >
        <div className="modal-header">
          <h2>🔍 Feature Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading feature details...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>⚠️</span>
              {error}
            </div>
          )}

          {!featureData && !loading && !error && (
            <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>
              <h3>📋 No data available</h3>
              <p>Please try clicking on a feature again.</p>
            </div>
          )}
          
          {featureData && !loading && (
            <div className="feature-details">
              <div className="feature-summary">
                <div className="feature-info">
                  <h3>🚀 {featureData.feature}</h3>
                  <p><strong>🛠️ Tool:</strong> {featureData.tool}</p>
                  <p><strong>📦 Version:</strong> {formatVersion(featureData.version)}</p>
                  <p><strong>⏰ Expiry:</strong> {featureData.expiry || 'N/A'}</p>
                  <p><strong>🆔 Process ID:</strong> {featureData.processId || 'N/A'}</p>
                  <p><strong>⏱️ Start Date:</strong> {formatStartTime(featureData.startDate)}</p>
                </div>
                <div className="license-stats">
                  <div className="stat-item">
                    <span className="stat-label">📊 Total Licenses</span>
                    <span className="stat-value">{featureData.totalLicenses}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">🔴 In Use</span>
                    <span className="stat-value usage">{featureData.inUse}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">🟢 Available</span>
                    <span className="stat-value available">{featureData.available}</span>
                  </div>
                </div>
              </div>

              <div className="user-details-section">
                <h4>👥 User Access Details</h4>
                <div className="user-table-container">
                  <table className="user-table">
                    <thead>
                      <tr>
                        <th>👤 Username</th>
                        <th>🔢 Usage Count</th>
                        <th>🖥️ Hostname</th>
                        <th>⏱️ Start Time</th>
                        <th>📦 Version</th>
                        <th>🆔 Process ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {featureData.userDetails && featureData.userDetails.length > 0 ? (
                        featureData.userDetails.map((user, index) => (
                            <tr key={index} className={getUsageCountClass(user.usageCount)}>
                              <td className="username-cell">{user.username}</td>
                              <td className="usage-count-cell">
                                <span className={`usage-badge ${getUsageCountClass(user.usageCount)}`}>
                                  {user.usageCount}
                                </span>
                              </td>
                              <td className="host-cell">{user.host}</td>
                              <td className="start-time-cell">
                                <span className="time-badge">
                                  {formatStartTime(user.startDate)}
                                </span>
                              </td>
                              <td className="version-cell">
                                <span className="version-badge">
                                  {formatVersion(user.version)}
                                </span>
                              </td>
                              <td className="process-id-cell">{user.processId || 'N/A'}</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="no-users">
                            <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>😴</span>
                            No users currently accessing this feature
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureDetailsModal;
