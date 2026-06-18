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

