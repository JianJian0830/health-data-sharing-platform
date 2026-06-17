import React, { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config/contract';

function App() {
  const [account, setAccount] = useState('');
  const [txStatus, setTxStatus] = useState('Idle'); 
  const [errorMessage, setErrorMessage] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [searchId, setSearchId] = useState('');
  const [viewedRecord, setViewedRecord] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setTxStatus('Pending Wallet Approval...');
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setTxStatus('Wallet Connected');
        setErrorMessage('');
      } catch (err) {
        setErrorMessage('Wallet connection rejected.');
        setTxStatus('Connection Failed');
      }
    } else {
      setErrorMessage('Please install MetaMask extension!');
    }
  };

  const handleRegisterPatient = async () => {
    if (!account) return setErrorMessage('Please connect your wallet first.');
    try {
      setTxStatus('Pending Confirmation');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.registerPatient(account);
      setTxStatus('Processing Registration...');
      await tx.wait();
      setTxStatus('Registration Success! 🎉');
      setErrorMessage('');
    } catch (err) {
      console.error(err);
      setErrorMessage('Registration failed or you are already registered.');
      setTxStatus('Failed ❌');
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!account) return setErrorMessage('Please connect your wallet first.');
    
    try {
      setTxStatus('Pending Confirmation');

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }], 
        });
      } catch (switchError) {
        console.error("Could not auto-switch network", switchError);
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.addRecord(diagnosis, treatment, { gasLimit: 300000 });
      setTxStatus('Uploading to Blockchain...');
      
      await tx.wait();
      setTxStatus('Success 🎉');
      setDiagnosis('');
      setTreatment('');
    } catch (err) {
      console.error(err);
      setErrorMessage(err.reason || 'Transaction reverted or cancelled.');
      setTxStatus('Failed ❌');
    }
  };

  const handleViewRecord = async (e) => {
    e.preventDefault();
    if (!account) return setErrorMessage('Please connect your wallet first.');

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const record = await contract.viewRecord(searchId);
      const recordArray = Array.from(record);

      setViewedRecord({
        id: recordArray[0].toString(),
        diagnosis: recordArray[1],
        treatment: recordArray[2],
        patient: recordArray[3]
      });
      setErrorMessage('');
    } catch (err) {
      console.error(err);
      setErrorMessage('Record ID does not exist or access denied.');
      setViewedRecord(null);
    }
  };

  // Fixed Styling Properties
  const theme = {
    background: '#f4f7f6',
    primary: '#10b981', 
    secondary: '#3b82f6', 
    cardBg: '#ffffff',
    textMain: '#1f2937',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    errorBg: '#fef2f2',
    errorText: '#ef4444',
  };

  return (
    <div style={{ backgroundColor: theme.background, minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif', color: theme.textMain, boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.secondary, margin: '0 0 8px 0' }}>🏥 MedRec Link</h1>
          <p style={{ color: theme.textMuted, margin: 0, fontSize: '1.1rem' }}>Decentralized Health Data Sharing Platform</p>
        </div>

        {/* 1. System Status Panel */}
        <div style={{ backgroundColor: theme.cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>Network Identity</h3>
            <button 
              onClick={connectWallet} 
              style={{ padding: '10px 20px', backgroundColor: account ? theme.primary : theme.secondary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
            >
              {account ? 'Connected 🔒' : 'Connect Wallet'}
            </button>
          </div>
          
          <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
            <p style={{ margin: '4px 0' }}><strong>Wallet Address:</strong> <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>{account || 'Not Connected'}</span></p>
            <p style={{ margin: '4px 0' }}><strong>System Tracker:</strong> <span style={{ color: txStatus.includes('Success') ? theme.primary : theme.secondary, fontWeight: '700' }}>{txStatus}</span></p>
          </div>

          {errorMessage && (
            <div style={{ marginTop: '16px', backgroundColor: theme.errorBg, color: theme.errorText, padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500', border: `1px solid ${theme.errorText}` }}>
              ⚠️ {errorMessage}
            </div>
          )}
        </div>

        {/* 2. Patient Registration Stage */}
        <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '1px solid #bfdbfe' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: '#1e40af' }}>Step 1: Patient System Initialization</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#1e3a8a' }}>New addresses must log into the blockchain index directory once before processing data files.</p>
          <button 
            onClick={handleRegisterPatient} 
            style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
          >
            Register Wallet Address
          </button>
        </div>

        {/* 3. Add Medical Record Form */}
        <div style={{ backgroundColor: theme.cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: '600', borderBottom: `2px solid ${theme.background}`, paddingBottom: '10px' }}>✍️ Create Medical Entry (Write Call)</h3>
          <form onSubmit={handleAddRecord}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: theme.textMuted, marginBottom: '6px' }}>Diagnosis Report</label>
              <input 
                type="text" 
                placeholder="e.g., Acute Rhinitis" 
                value={diagnosis} 
                onChange={(e) => setDiagnosis(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', boxSizing: 'border-box', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '1rem' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: theme.textMuted, marginBottom: '6px' }}>Prescribed Treatment Plan</label>
              <input 
                type="text" 
                placeholder="e.g., Antihistamines 10mg daily" 
                value={treatment} 
                onChange={(e) => setTreatment(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', boxSizing: 'border-box', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '1rem' }}
              />
            </div>
            <button 
              type="submit" 
              style={{ width: '100%', padding: '14px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Commit File to Blockchain
            </button>
          </form>
        </div>

        {/* 4. View Medical Record Section */}
        <div style={{ backgroundColor: theme.cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: '600', borderBottom: `2px solid ${theme.background}`, paddingBottom: '10px' }}>🔍 Request Health File (Read Call)</h3>
          <form onSubmit={handleViewRecord} style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input 
              type="number" 
              placeholder="Enter File Record ID (e.g., 1)" 
              value={searchId} 
              onChange={(e) => setSearchId(e.target.value)} 
              required 
                          style={{ flex: '1 1 200px', padding: '12px', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            style={{ padding: '12px 24px', backgroundColor: theme.secondary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', flex: '1 1 auto' }}
          >
            Fetch File
          </button>
        </form>

        {viewedRecord && (
          <div style={{ marginTop: '20px', backgroundColor: '#f9fafb', borderRadius: '10px', padding: '20px', border: `1px solid ${theme.border}` }}>
            <h4 style={{ margin: '0 0 14px 0', color: theme.secondary, fontSize: '1.05rem', fontWeight: '700' }}>📋 Validated Medical Record Output</h4>
            <div style={{ display: 'grid', gap: '10px', fontSize: '0.95rem' }}>
              <p style={{ margin: 0 }}><strong>Record Archive ID:</strong> {viewedRecord.id}</p>
              <p style={{ margin: 0 }}><strong>Diagnosis:</strong> <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: '500' }}>{viewedRecord.diagnosis}</span></p>
              <p style={{ margin: 0 }}><strong>Treatment Plan:</strong> {viewedRecord.treatment}</p>
              <p style={{ margin: 0, wordBreak: 'break-all' }}><strong>Signatory Patient:</strong> <span style={{ fontFamily: 'monospace', color: theme.textMuted }}>{viewedRecord.patient}</span></p>
            </div>
          </div>
        )}
      </div>

    </div>
  </div>
);
}

export default App;
