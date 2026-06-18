import React, { useState, useEffect } from 'react';
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

  // Active Role Tab tracking: 'admin', 'patient', or 'doctor'
  const [activeRole, setActiveRole] = useState('patient');

  const [adminPatientInput, setAdminPatientInput] = useState('');
  const [adminDoctorInput, setAdminDoctorInput] = useState('');
  const [grantDoctorInput, setGrantDoctorInput] = useState('');

  // Automatically check owner address when wallet connects
  useEffect(() => {
    if (account) {
      checkContractOwner();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [account]);

  const checkContractOwner = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const ownerAddress = await contract.owner();
      
      // Auto-switch to admin panel if the connected wallet is the owner account
      if (account.toLowerCase() === ownerAddress.toLowerCase()) {
        setActiveRole('admin');
      }
    } catch (err) {
      console.error("Could not fetch owner", err);
    }
  };

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

  const handleAdminRegisterPatient = async (e) => {
    e.preventDefault();
    if (!account) return setErrorMessage('Please connect wallet.');
    try {
      setTxStatus('Admin Registering Patient...');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.registerPatient(adminPatientInput);
      await tx.wait();
      setTxStatus('Patient Registered Successfully! 🎉');
      setAdminPatientInput('');
    } catch (err) {
      console.error(err);
      setErrorMessage('Admin registration failed.');
    }
  };

  const handleAdminRegisterDoctor = async (e) => {
    e.preventDefault();
    if (!account) return setErrorMessage('Please connect wallet.');
    try {
      setTxStatus('Admin Registering Doctor...');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.registerDoctor(adminDoctorInput);
      await tx.wait();
      setTxStatus('Doctor Registered Successfully! 🎉');
      setAdminDoctorInput('');
    } catch (err) {
      console.error(err);
      setErrorMessage('Admin registration failed.');
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!account) return setErrorMessage('Please connect wallet.');
    try {
      setTxStatus('Submitting Record...');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.addRecord(diagnosis, treatment, { gasLimit: 300000 });
      await tx.wait();
      setTxStatus('Record Added Successfully! 🎉');
      setDiagnosis('');
      setTreatment('');
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to add record.');
    }
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!account) return setErrorMessage('Please connect wallet.');
    try {
      setTxStatus('Granting Access to Doctor...');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.grantAccess(grantDoctorInput);
      await tx.wait();
      setTxStatus('Access Granted Successfully! 🎉');
      setGrantDoctorInput('');
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to grant access.');
    }
  };

  const handleViewRecord = async (e) => {
    e.preventDefault();
    if (!account) return setErrorMessage('Please connect wallet.');
    try {
      setTxStatus('Fetching Record...');
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
      setTxStatus('Record Fetched Successfully! 🎉');
      setErrorMessage('');
    } catch (err) {
      console.error(err);
      setErrorMessage('Access Denied or Record ID does not exist.');
      setViewedRecord(null);
    }
  };

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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.secondary, margin: '0 0 8px 0' }}>🏥 MedRec Link</h1>
          <p style={{ color: theme.textMuted, margin: 0, fontSize: '1.1rem' }}>Decentralized Health Data Sharing Platform</p>
        </div>

        {/* System Identity Panel */}
        <div style={{ backgroundColor: theme.cardBg, borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Wallet:</strong> <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{account || 'Not Connected'}</span></p>
              <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Status:</strong> <span style={{ color: theme.secondary, fontWeight: '700' }}>{txStatus}</span></p>
            </div>
            <button onClick={connectWallet} style={{ padding: '10px 20px', backgroundColor: account ? theme.primary : theme.secondary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              {account ? 'Connected 🔒' : 'Connect Wallet'}
            </button>
          </div>
          {errorMessage && (
            <div style={{ marginTop: '12px', backgroundColor: theme.errorBg, color: theme.errorText, padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
              ⚠️ {errorMessage}
            </div>
          )}
        </div>

        {/* ROLE SELECTION TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button onClick={() => setActiveRole('admin')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', backgroundColor: activeRole === 'admin' ? '#ea580c' : '#e5e7eb', color: activeRole === 'admin' ? '#fff' : '#4b5563' }}>
            👑 Admin Portal
          </button>
          <button onClick={() => setActiveRole('patient')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', backgroundColor: activeRole === 'patient' ? '#2563eb' : '#e5e7eb', color: activeRole === 'patient' ? '#fff' : '#4b5563' }}>
            👤 Patient Dashboard
          </button>
          <button onClick={() => setActiveRole('doctor')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', backgroundColor: activeRole === 'doctor' ? '#10b981' : '#e5e7eb', color: activeRole === 'doctor' ? '#fff' : '#4b5563' }}>
            🩺 Doctor View
          </button>
        </div>

        {/* RENDER ACTIVE MODULE ONLY */}
        {activeRole === 'admin' && (
          <div style={{ backgroundColor: '#fff7ed', borderRadius: '12px', padding: '24px', border: '1px solid #ffedd5' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: '600', color: '#c2410c' }}>👑 Admin Management Control</h3>
            <form onSubmit={handleAdminRegisterPatient} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#9a3412', marginBottom: '6px' }}>Register Patient Address</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter patient wallet 0x..." value={adminPatientInput} onChange={(e) => setAdminPatientInput(e.target.value)} required style={{ flex: 1, padding: '10px', border: '1px solid #fed7aa', borderRadius: '8px' }} />
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Authorize Patient</button>
              </div>
            </form>
            <form onSubmit={handleAdminRegisterDoctor}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#9a3412', marginBottom: '6px' }}>Register Doctor Address</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter doctor wallet 0x..." value={adminDoctorInput} onChange={(e) => setAdminDoctorInput(e.target.value)} required style={{ flex: 1, padding: '10px', border: '1px solid #fed7aa', borderRadius: '8px' }} />
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Authorize Doctor</button>
              </div>
            </form>
          </div>
        )}

        {activeRole === 'patient' && (
          <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '24px', border: '1px solid #bfdbfe' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: '600', color: '#1e40af' }}>👤 Patient Workspace</h3>
            <form onSubmit={handleAddRecord} style={{ marginBottom: '20px', borderBottom: '1px solid #dbeafe', paddingBottom: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '6px' }}>Diagnosis Report</label>
                <input type="text" placeholder="e.g., Asthma" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #bfdbfe', borderRadius: '8px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '6px' }}>Treatment Plan</label>
                <input type="text" placeholder="e.g., Inhaler twice daily" value={treatment} onChange={(e) => setTreatment(e.target.value)} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #bfdbfe', borderRadius: '8px' }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Save Record to Chain</button>
            </form>
            <form onSubmit={handleGrantAccess}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '6px' }}>Authorize Doctor Access</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter doctor wallet 0x..." value={grantDoctorInput} onChange={(e) => setGrantDoctorInput(e.target.value)} required style={{ flex: 1, padding: '10px', border: '1px solid #bfdbfe', borderRadius: '8px' }} />
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Grant Access</button>
              </div>
            </form>
          </div>
        )}

        {activeRole === 'doctor' && (
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '12px', padding: '24px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: '600', color: '#065f46' }}>Submittor Medical File Request</h3>
            <form onSubmit={handleViewRecord} style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input type="number" placeholder="Enter Record ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} required style={{ flex: '1 1 200px', padding: '12px', border: `1px solid ${theme.border}`, borderRadius: '8px', boxSizing: 'border-box' }} />
              <button type="submit" style={{ padding: '12px 24px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', flex: '1 1 auto' }}>Fetch File</button>
            </form>
            {viewedRecord && (
              <div style={{ marginTop: '20px', backgroundColor: '#f9fafb', borderRadius: '10px', padding: '20px', border: `1px solid ${theme.border}` }}>
                <h4 style={{ margin: '0 0 14px 0', color: theme.primary, fontWeight: '700' }}>📋 Validated Medical Record Output</h4>
                <div style={{ display: 'grid', gap: '10px', fontSize: '0.95rem' }}>
                  <p style={{ margin: 0 }}><strong>ID:</strong> {viewedRecord.id}</p>
                  <p style={{ margin: 0 }}><strong>Diagnosis:</strong> <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '4px' }}>{viewedRecord.diagnosis}</span></p>
                  <p style={{ margin: 0 }}><strong>Treatment:</strong> {viewedRecord.treatment}</p>
                  <p style={{ margin: 0, wordBreak: 'break-all' }}><strong>Patient Address:</strong> <span style={{ fontFamily: 'monospace', color: theme.textMuted }}>{viewedRecord.patient}</span></p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
