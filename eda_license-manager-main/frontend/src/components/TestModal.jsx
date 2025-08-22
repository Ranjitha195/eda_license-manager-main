import React, { useState } from 'react';
import FeatureDetailsModal from './FeatureDetailsModal';

const TestModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testData, setTestData] = useState(null);

  const openTestModal = () => {
    setTestData({
      feature: 'Test Feature 111',
      tool: 'cadence',
      version: '23.1',
      expiry: '06-aug-2025',
      totalLicenses: 2580,
      inUse: 183,
      available: 2397,
      userDetails: [
        {
          username: 'sos13',
          host: 'narmada',
          port: '18',
          version: '6.180',
          processId: '6701',
          startTime: 'Thu 6/26 16:12',
          usageCount: 1
        },
        {
          username: 'sumvnrcl015',
          host: 'g14v2',
          port: '7908.0',
          version: '6.180',
          processId: '36303',
          startTime: 'Thu 6/26 16:17',
          usageCount: 2
        },
        {
          username: 'sos8',
          host: 'narmada',
          port: '13',
          version: '6.180',
          processId: '45702',
          startTime: 'Thu 6/26 16:20',
          usageCount: 1
        }
      ]
    });
    setIsOpen(true);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Test Modal Component</h2>
      <button 
        onClick={openTestModal}
        style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        Open Test Modal
      </button>

      <FeatureDetailsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        featureData={testData}
        loading={false}
        error={null}
      />
    </div>
  );
};

export default TestModal;
