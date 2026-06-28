import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config/contract';

// Importing your custom PNG asset structures from the local src folder directory
import medicalSymbolPng from './medical-symbol.png';
import settingPng from './setting.png';
import patientPng from './patient.png';
import doctorPng from './doctor.png';
import medicalReportPng from './medical-report.png';
import padlockPng from './padlock.png';
import hospitalPng from './hospital.png';

function App() {
  const [account, setAccount] = useState('');
  const [txStatus, setTxStatus] = useState('Idle'); 
  const [errorMessage, setErrorMessage] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [searchId, setSearchId] = useState('');
  const [viewedRecord, setViewedRecord] = useState(null);

  // Active Role Tab tracking parameters: 'admin', 'patient', or 'doctor'
  const [activeRole, setActiveRole] = useState('patient');

  const [adminPatientInput, setAdminPatientInput] = useState('');
  const [adminDoctorInput, setAdminDoctorInput] = useState('');
  const [grantDoctorInput, setGrantDoctorInput] = useState('');
  
  const [incomingRequests, setIncomingRequests] = useState([]);

  // Automatically check contract owner parameters when a wallet connects
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
      
      // Auto-switch to admin panel if the connected wallet is the owner account profile
      if (account.toLowerCase() === ownerAddress.toLowerCase()) {
        setActiveRole('admin');
      }
    } catch (err) {
      console.error("Could not fetch owner", err);
    }
  };

  // Live Event Listener monitoring the blockchain for incoming requests
  useEffect(() => {
    if (!account) return;

    const listenForRequests = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const filter = contract.filters.AccessRequested(null, account);

        const pastEvents = await contract.queryFilter(filter, -1000);
        const uniquePastDoctors = [...new Set(pastEvents.map(event => event.args.doctor))];
        setIncomingRequests(uniquePastDoctors);

        contract.on(filter, (doctor, patient) => {
          setIncomingRequests(prev => [...new Set([...prev, doctor])]);
          setTxStatus('New incoming access request detected! 🔔');
        });

        return () => {
          contract.removeAllListeners();
        };
      } catch (err) {
        console.error("Event listener connection failed", err);
      }
    };

    listenForRequests();
  }, [account]);

    const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setTxStatus('Pending Wallet Approval...');
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Fixed account array mapping bug to cleanly pick the first active string index
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
        }
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
      
      // NEW LINE: Instantly filters out the doctor address from the live UI request box
      setIncomingRequests(prev => prev.filter(doc => doc.toLowerCase() !== grantDoctorInput.toLowerCase()));
      
      setTxStatus('Access Granted Successfully! 🎉');
      setGrantDoctorInput('');
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to grant access.');
    }
  };


  const handleRevokeAccess = async (e) => {
    e.preventDefault();
    if (!account) return setErrorMessage('Please connect wallet.');
    try {
      setTxStatus('Revoking Access from Doctor...');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.revokeAccess(grantDoctorInput);
      await tx.wait();
      setTxStatus('Access Revoked Successfully! ❌');
      setGrantDoctorInput('');
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to revoke access.');
    }
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    if (!account) return setErrorMessage('Please connect wallet.');
    try {
      setTxStatus('Submitting Access Request to Patient...');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.requestAccess(grantDoctorInput);
      await tx.wait();
      setTxStatus('Access Request Submitted Successfully! 🔔');
      setGrantDoctorInput('');
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to submit access request.');
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
        
        {/* Custom Medical Symbol Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <img src={medicalSymbolPng} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.secondary, margin: 0 }}>MedRec Link</h1>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ color: theme.textMuted, margin: 0, fontSize: '1.1rem' }}>Decentralized Health Data Sharing Platform</p>
        </div>

        {/* Identity Wrapper */}
        <div style={{ backgroundColor: theme.cardBg, borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Wallet:</strong> <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>{account || 'Not Connected'}</span></p>
              <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Status:</strong> <span style={{ color: theme.secondary, fontWeight: '700' }}>{txStatus}</span></p>
            </div>
            <button onClick={connectWallet} style={{ padding: '10px 20px', backgroundColor: account ? theme.primary : theme.secondary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={padlockPng} alt="lock" style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)' }} />
              {account ? 'Connected' : 'Connect Wallet'}
            </button>
          </div>
          {errorMessage && (
            <div style={{ marginTop: '12px', backgroundColor: theme.errorBg, color: theme.errorText, padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
              ⚠️ {errorMessage}
            </div>
          )}
        </div>

        {/* SEGMENTED NAVBAR CONTROLS WITH CUSTOM PNG ICON ASSIGNMENTS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button onClick={() => setActiveRole('admin')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', backgroundColor: activeRole === 'admin' ? '#ea580c' : '#e5e7eb', color: activeRole === 'admin' ? '#fff' : '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <img src={settingPng} alt="admin" style={{ width: '18px', height: '18px', filter: activeRole === 'admin' ? 'brightness(0) invert(1)' : 'none' }} /> Admin Portal
          </button>
          <button onClick={() => setActiveRole('patient')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', backgroundColor: activeRole === 'patient' ? '#2563eb' : '#e5e7eb', color: activeRole === 'patient' ? '#fff' : '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <img src={patientPng} alt="patient" style={{ width: '18px', height: '18px', filter: activeRole === 'patient' ? 'brightness(0) invert(1)' : 'none' }} /> Patient Dashboard
          </button>
          <button onClick={() => setActiveRole('doctor')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', backgroundColor: activeRole === 'doctor' ? '#10b981' : '#e5e7eb', color: activeRole === 'doctor' ? '#fff' : '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <img src={doctorPng} alt="doctor" style={{ width: '18px', height: '18px', filter: activeRole === 'doctor' ? 'brightness(0) invert(1)' : 'none' }} /> Doctor View
          </button>
        </div>

        {/* CONFIGURATION PORTAL RENDER LINES */}
        {activeRole === 'admin' && (
          <div style={{ backgroundColor: '#fff7ed', borderRadius: '12px', padding: '24px', border: '1px solid #ffedd5' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: '600', color: '#c2410c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={hospitalPng} alt="admin-panel" style={{ width: '22px', height: '22px' }} /> Admin Management Control
            </h3>
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
          <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '24px', border: '1px solid #bfdbfe', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: '600', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={medicalReportPng} alt="workspace" style={{ width: '22px', height: '22px' }} /> Patient Workspace
            </h3>

            {/* INCOMING REQUEST LISTER BOX LAYER */}
            <div style={{ marginBottom: '24px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#166534', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📥 Incoming Doctor Access Requests
              </h4>
              {incomingRequests.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803d' }}>No active pending access requests found for your wallet address.</p>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {incomingRequests.map((docAddress, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #dcfce7', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <span style={{ fontFamily: 'monospace', color: '#1f2937' }}><strong>Doctor:</strong> {docAddress}</span>
                      <button type="button" onClick={() => setGrantDoctorInput(docAddress)} style={{ padding: '4px 10px', backgroundColor: '#166534', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>Select</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RECORD WRITING FORM */}
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

            {/* ACCESS DELEGATION BUTTON LAYER */}
            <form onSubmit={handleGrantAccess}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '6px' }}>Manage Doctor Access Permissions</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Enter target doctor wallet 0x..." value={grantDoctorInput} onChange={(e) => setGrantDoctorInput(e.target.value)} required style={{ flex: 1, padding: '10px', border: '1px solid #bfdbfe', borderRadius: '8px', minWidth: '200px' }} />
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Grant Access</button>
                <button type="button" onClick={handleRevokeAccess} style={{ padding: '10px 20px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Revoke Access</button>
              </div>
            </form>
          </div>
        )}

        {activeRole === 'doctor' && (
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '12px', padding: '24px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: '600', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={doctorPng} alt="portal" style={{ width: '22px', height: '22px' }} /> Doctor Portal
            </h3>

            {/* ACCESS REQUEST SYSTEM PANEL */}
            <form onSubmit={handleRequestAccess} style={{ marginBottom: '24px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#065f46', marginBottom: '6px' }}>Request Blockchain Access Permissions</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter target patient wallet address 0x..." value={grantDoctorInput} onChange={(e) => setGrantDoctorInput(e.target.value)} required style={{ flex: 1, padding: '10px', border: `1px solid ${theme.border}`, borderRadius: '8px' }} />
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#065f46', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Request Access</button>
              </div>
            </form>

            {/* RECORD READ QUERY OPERATION */}
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: '600', color: theme.textMain }}>Query Health Records (Read Operation)</h4>
            <form onSubmit={handleViewRecord} style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input type="number" placeholder="Enter Record ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} required style={{ flex: '1 1 200px', padding: '12px', border: `1px solid ${theme.border}`, borderRadius: '8px', boxSizing: 'border-box' }} />
              <button type="submit" style={{ padding: '12px 24px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', flex: '1 1 auto' }}>Fetch File</button>
            </form>

            {viewedRecord && (
              <div style={{ marginTop: '20px', backgroundColor: '#f9fafb', borderRadius: '10px', padding: '20px', border: `1px solid ${theme.border}` }}>
                <h4 style={{ margin: '0 0 14px 0', color: theme.primary, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src={medicalReportPng} alt="output" style={{ width: '18px', height: '18px' }} /> Validated Medical Record Output
                </h4>
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
