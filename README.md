# MedRec Link - Decentralized Health Data Sharing Platform

A secure, blockchain-backed decentralized application (dApp) that allows patients to manage and audit their medical records safely. Built with React.js, Ethers.js (v5), and Truffle / Ganache.

---

## Repository Layout

health-data-gui  (Frontend React Web Dashboard with Role Tabs)
medrec           (Backend Truffle Smart Contract Workspace)

---

## System Pre-requisites

Ensure the following tools are installed on your system before proceeding:
Node.js (v16 or higher)
Truffle CLI (npm install -g truffle)
Ganache Desktop GUI 
MetaMask Browser Extension

---

## Setup and Deployment Instructions

Follow these steps sequentially to launch the smart contract and the front-end dashboard user interface:

### Step 1: Run the Local Blockchain (Ganache)
1. Launch the Ganache Desktop GUI and click Quickstart.
2. Select the Gear Icon (Settings) in the top right corner.
3. Navigate to the Server tab and modify the Port Number to 8545.
4. Delete the current Network ID and type 1337 to synchronize with MetaMask's native local runtime cache.
5. Click Save and Restart in the top-right corner.

### Step 2: Compile and Deploy the Smart Contract
1. Open your terminal and navigate directly into the backend contract folder:
   cd medrec
2. Deploy the smart contract onto the freshly configured local port using Truffle:
   truffle migrate --reset
3. Copy the newly generated contract address output from the terminal logs (visible under the 2_deploy_contracts.js block).

### Step 3: Configure Frontend Properties
1. Open the frontend repository directory and open health-data-gui/src/config/contract.js.
2. Replace the first string value with your newly copied local contract address. Ensure export const CONTRACT_ADDRESS equals your new address string.

### Step 4: Configure MetaMask Wallet
1. Open MetaMask and switch your network selection to Localhost 8545 (running on Chain ID 1337).
2. Go back to your Ganache Desktop window and look at the first row (Index 0). Click the Key Icon on the far right.
3. Copy the account's Private Key.
4. In MetaMask, go to Add account or hardware wallet then Import account, paste the private key, and click Import to claim the 100 test ETH required for transaction gas.

### Step 5: Launch the React Dashboard GUI
1. Open a separate terminal panel, navigate to the frontend web directory, and download dependencies:
   cd health-data-gui
   npm install
2. Start the local client development server:
   npm start
3. Your browser will automatically launch the interactive portal at http://localhost:3000.

---

## Video Demo Walkthrough Path

To demonstrate the full capability of the application to graders, execute the following steps on screen:

### Phase 1: Admin Actions
1. Connect MetaMask using Account 1 (the funded contract deployer account). The website will auto-detect this address and lock onto the orange Admin Portal.
2. In MetaMask, copy the address for Account 2. Paste it into the Register Patient box and click Authorize Patient. Confirm the transaction.
3. In MetaMask, copy the address for Account 3. Paste it into the Register Doctor box and click Authorize Doctor. Confirm the transaction.

### Phase 2: Patient Actions
1. Open MetaMask and fund Account 2 and Account 3 by sending 5 fake ETH to each from your primary Account 1 (to provide gas money for their transactions).
2. Switch MetaMask to Account 2.
3. On the webpage, click the Patient Dashboard tab.
4. Enter your medical data parameters into the form (e.g., Diagnosis: Flu, Treatment: Sleep more) and click Save Record to Chain. Confirm the transaction in MetaMask.
5. In the access field below the form, paste the address string for Account 3 (the Doctor) and click Grant Access. Confirm the transaction.

### Phase 3: Doctor Actions
1. Switch MetaMask to Account 3.
2. On the webpage, click the green Doctor View tab.
3. Type the Record ID (0 or 1) into the input box and click Fetch File.
4. The smart contract will automatically validate permissions, allow the request, and render the secure text data fields on screen.
