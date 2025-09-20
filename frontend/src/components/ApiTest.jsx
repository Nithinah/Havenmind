// Create a test component: frontend/src/components/ApiTest.jsx

import React, { useState } from 'react';
import apiService from '../services/api';

const ApiTest = () => {
  const [status, setStatus] = useState('Not tested');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing...');
    
    try {
      const result = await apiService.get('/');
      setStatus('✅ Connected successfully!');
      setResponse(result);
    } catch (error) {
      setStatus(`❌ Connection failed: ${error.message}`);
      setResponse(error);
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    setLoading(true);
    setStatus('Testing health...');
    
    try {
      const result = await apiService.get('/health');
      setStatus('✅ Health check passed!');
      setResponse(result);
    } catch (error) {
      setStatus(`❌ Health check failed: ${error.message}`);
      setResponse(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>API Connection Test</h3>
      <p><strong>Current API URL:</strong> {apiService.baseURL}</p>
      <p><strong>Status:</strong> {status}</p>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testConnection} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          {loading ? 'Testing...' : 'Test Root Endpoint'}
        </button>
        
        <button 
          onClick={testHealth} 
          disabled={loading}
          style={{ padding: '8px 16px' }}
        >
          {loading ? 'Testing...' : 'Test Health Endpoint'}
        </button>
      </div>

      {response && (
        <div style={{ marginTop: '15px' }}>
          <h4>Response:</h4>
          <pre style={{
            backgroundColor: '#f0f0f0',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;