import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import FileBasedMultisig from '@/components/tx/FileBasedMultisig';
import { useWeb3 } from '@/hooks/useWeb3';
import { useConnectWallet } from '@/hooks/useConnectWallet';

const IndexPage: NextPage = () => {
  const { rpcProvider, currentAddress } = useWeb3();
  const { handleConnect, handleDisconnect } = useConnectWallet();
  
  const [safeAddressInput, setSafeAddressInput] = useState('');
  const [activeSafeAddress, setActiveSafeAddress] = useState('');
  
  // State wrapper to store the intercepted hex transaction payload from your custom app
  const [interceptedTx, setInterceptedTx] = useState<any>(null);

  // Background event framework listener to capture iframe sdk postMessage notifications
  useEffect(() => {
    const handleSafeAppMessage = (event: MessageEvent) => {
      // Validate that the request structure matches the official Safe Apps SDK signature
      if (event.data && event.data.params && event.data.method === 'sendTransactions') {
        console.log("Safe App SDK interaction caught:", event.data.params.txs);
        
        // Extract the target payload array containing: [{ to, value, data }]
        const txsArray = event.data.params.txs;
        
        if (txsArray && txsArray.length > 0) {
          // Pass the transaction metadata array directly to our React configuration loop
          setInterceptedTx(txsArray[0]); 
          alert("Transaction request received from your custom app! Use the dashboard layout panel below to sign and download your JSON data file.");
        }
      }
    };

    window.addEventListener('message', handleSafeAppMessage);
    return () => window.removeEventListener('message', handleSafeAppMessage);
  }, []);

  return (
    <>
      <Head>
        <title>Safe{Wallet} – Local Chapel Workspace</title>
      </Head>

      <main style={{ padding: '40px 20px', minHeight: '100vh', backgroundColor: '#0F1011', fontFamily: 'Inter, sans-serif' }}>
        
        {/* Connection Topbar bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto 20px auto', padding: '16px 24px', backgroundColor: '#1E2022', borderRadius: '12px', border: '1px solid #2E3033', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#A1A8B3', fontSize: '13px' }}>Signer Wallet Connection Status:</span>
            <div style={{ color: currentAddress ? '#80FFAD' : '#FF8085', fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
              {currentAddress ? `Connected: ${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}` : 'Disconnected'}
            </div>
          </div>
          
          {!currentAddress ? (
            <button onClick={handleConnect} style={{ backgroundColor: '#F0B90B', color: '#121314', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Connect Wallet
            </button>
          ) : (
            <button onClick={handleDisconnect} style={{ backgroundColor: 'transparent', color: '#FF8085', border: '1px solid #FF8085', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Disconnect
            </button>
          )}
        </div>

        {/* Dynamic Context Render Loop */}
        {!activeSafeAddress ? (
          <div style={{ backgroundColor: '#121314', color: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #2E3033', maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#F0B90B' }}>Target Safe Wallet Selection</h3>
            <input 
              type="text" value={safeAddressInput} onChange={(e) => setSafeAddressInput(e.target.value)} placeholder="0x..." 
              style={{ width: '100%', backgroundColor: '#1E2022', color: '#FFFFFF', border: '1px solid #2E3033', borderRadius: '8px', padding: '12px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            <button 
              onClick={() => safeAddressInput.startsWith('0x') && setActiveSafeAddress(safeAddressInput)} disabled={!currentAddress} 
              style={{ backgroundColor: currentAddress ? '#F0B90B' : '#4E4426', color: '#121314', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, width: '100%' }}
            >
              Initialize Workspace Interface
            </button>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <button onClick={() => setActiveSafeAddress('')} style={{ background: 'none', border: 'none', color: '#A1A8B3', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }}>
                ← Change Target Safe Address
              </button>
            </div>
            
            {/* 3. Pass the dynamic state variable down to the component file */}
            <FileBasedMultisig 
              provider={rpcProvider} 
              safeAddress={activeSafeAddress} 
              customAppTxData={interceptedTx} 
            />

            {/* Simulated Custom App IFrame Window Wrapper Area */}
            <div style={{ maxWidth: '600px', margin: '30px auto 0 auto', border: '1px dashed #2E3033', borderRadius: '12px', padding: '20px', backgroundColor: '#090A0A', textAlign: 'center' }}>
              <p style={{ color: '#A1A8B3', fontSize: '13px' }}>Custom App Sandboxed Context Workspace (`iframe` Simulation Container)</p>
              {/* Point this URL directly to your locally hosted or live testnet custom app destination */}
              <iframe 
                src="http://testnet-usdtinrp.system4trading.com" 
                title="Custom Safe App Container"
                style={{ width: '100%', height: '350px', border: '1px solid #2E3033', borderRadius: '8px', backgroundColor: '#FFFFFF', marginTop: '10px' }} 
              />
            </div>
          </div>
        )}

      </main>
    </>
  );
};

export default IndexPage;
