import React, { useState } from 'react';
import Safe from '@safe-global/protocol-kit';
import type { SafeProvider } from '@safe-global/protocol-kit';

// Define the shape of incoming arguments explicitly
interface FileBasedMultisigProps {
  provider: SafeProvider | any;
  safeAddress: string;
  customAppTxData?: any; 
}

// 💡 FIXED: Explicitly bind the type interface definition right on the function signature line
export default function FileBasedMultisig({ 
  provider, 
  safeAddress, 
  customAppTxData 
}: FileBasedMultisigProps) {
  
  const [jsonInput, setJsonInput] = useState('');
  const [txStatus, setTxStatus] = useState('');

  // OWNER 1: Create transaction payload and trigger file download
  const handleCreateAndDownload = async () => {
    try {
      setTxStatus('Accessing injected wallet extension...');
      
      const browserProvider = provider || (typeof window !== 'undefined' ? (window as any).ethereum : null);
      if (!browserProvider) {
        throw new Error("No web3 wallet found. Please install MetaMask or Trust Wallet.");
      }

      await browserProvider.request({ method: 'eth_requestAccounts' });

      const protocolKit = await Safe.init({ 
        provider: browserProvider, 
        safeAddress: safeAddress 
      });

      setTxStatus('Wallet connected to Safe Kit. Initiating transaction signature...');
      
      const txData = customAppTxData || { to: '0x0000000000000000000000000000000000000000', value: '0', data: '0x' };
      
      const safeTx = await protocolKit.createTransaction({ transactions: [txData] });
      const signedTx = await protocolKit.signTransaction(safeTx);

      const fileData = JSON.stringify(signedTx.data);
      const blob = new Blob([fileData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chapel-safe-tx-${signedTx.data.nonce}.json`;
      a.click();
      setTxStatus('Transaction file downloaded successfully!');
    } catch (e: unknown) {
      const errorInstance = e as Error;
      setTxStatus(`Error: ${errorInstance.message}`);
    }
  };

  // Process manual file uploads from device storage
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setJsonInput(text);
        setTxStatus('File text content successfully loaded into state!');
      };
      reader.readAsText(file);
    }
  };

  // OWNER 2: Combine signatures and broadcast to Chapel on-chain
  const handleImportAndExecute = async () => {
    try {
      if (!jsonInput.trim()) {
        setTxStatus('Error: Input data area is empty.');
        return;
      }
      setTxStatus('Accessing injected wallet extension...');
      
      const browserProvider = provider || (typeof window !== 'undefined' ? (window as any).ethereum : null);
      if (!browserProvider) {
        throw new Error("No web3 wallet found. Please install MetaMask or Trust Wallet.");
      }

      await browserProvider.request({ method: 'eth_requestAccounts' });

      const protocolKit = await Safe.init({ 
        provider: browserProvider, 
        safeAddress: safeAddress 
      });

      setTxStatus('Rebuilding transaction payload from file data...');
      const importedData = JSON.parse(jsonInput);

      const safeTxFromOwner1 = await protocolKit.createTransaction({ transactions: importedData.transactions });
      safeTxFromOwner1.addSignature(importedData.signatures);

      setTxStatus('Prompting Owner 2 for execution signature...');
      const finalSignedTx = await protocolKit.signTransaction(safeTxFromOwner1);
      
      setTxStatus('Broadcasting fully-signed payload live to Chapel Testnet...');
      const result = await protocolKit.executeTransaction(finalSignedTx);
      setTxStatus(`Success! Broadcasted Hash: ${result.hash}`);
    } catch (e: unknown) {
      const errorInstance = e as Error;
      setTxStatus(`Execution Failed: ${errorInstance.message}`);
    }
  };

  return (
    <div style={{ backgroundColor: '#121314', color: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #2E3033', fontFamily: 'Inter, sans-serif', maxWidth: '600px', margin: '40px auto', boxShadow: '0px 4px 20px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#F0B90B', width: '12px', height: '12px', borderRadius: '50%', marginRight: '12px' }}></div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>BSC Chapel Testnet Multi-Sig</h2>
      </div>

      <p style={{ color: '#A1A8B3', fontSize: '14px', marginBottom: '24px' }}>
        Safe Address: <code style={{ backgroundColor: '#1E2022', padding: '4px 8px', borderRadius: '4px', color: '#F0B90B' }}>{safeAddress}</code>
      </p>

      {/* Owner 1 Section */}
      <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #2E3033' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#F0B90B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Creator Workflows (Owner 1)</h4>
        <p style={{ color: '#A1A8B3', fontSize: '13px', margin: '0 0 16px 0' }}>Propose a new transaction asset update and export the signed file payload.</p>
        <button onClick={handleCreateAndDownload} style={{ backgroundColor: '#121314', color: '#F0B90B', border: '1px solid #F0B90B', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', width: '100%' }}>
          Create & Download Tx File
        </button>
      </div>

      {/* Owner 2 Section */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#F0B90B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Signer Workflows (Owner 2)</h4>
        
        <p style={{ color: '#A1A8B3', fontSize: '13px', margin: '0 0 12px 0' }}>Method A: Select the transaction `.json` file from your device:</p>
        <input 
          type="file" 
          accept=".json" 
          onChange={handleFileUpload} 
          style={{ width: '100%', color: '#FFFFFF', backgroundColor: '#1E2022', padding: '10px', borderRadius: '8px', border: '1px solid #2E3033', marginBottom: '16px', boxSizing: 'border-box' }} 
        />

        <p style={{ color: '#A1A8B3', fontSize: '13px', margin: '0 0 12px 0' }}>Method B: Or manually paste the raw string data content below:</p>
        <textarea rows={4} value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder='{"transactions": [...], "signatures": "..."}' style={{ width: '100%', backgroundColor: '#1E2022', color: '#FFFFFF', border: '1px solid #2E3033', borderRadius: '8px', padding: '12px', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical', marginBottom: '16px' }} />
        
        <button onClick={handleImportAndExecute} style={{ backgroundColor: '#F0B90B', color: '#121314', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', width: '100%' }}>
          Import, Sign & Execute Live
        </button>
      </div>

      {/* Status Log Console */}
      {txStatus && (
        <div style={{ backgroundColor: txStatus.startsWith('Error') || txStatus.startsWith('Execution') ? '#2A1415' : '#142A1E', border: `1px solid ${txStatus.startsWith('Error') || txStatus.startsWith('Execution') ? '#662225' : '#226639'}`, color: txStatus.startsWith('Error') || txStatus.startsWith('Execution') ? '#FF8085' : '#80FFAD', padding: '12px', borderRadius: '8px', fontSize: '13px', wordBreak: 'break-all' }}>
          {txStatus}
        </div>
      )}
    </div>
  );
}
