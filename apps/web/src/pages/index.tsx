import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import FileBasedMultisig from '@/components/tx/FileBasedMultisig';

const IndexPage: NextPage = () => {
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [safeAddressInput, setSafeAddressInput] = useState<string>('');
  const [activeSafeAddress, setActiveSafeAddress] = useState<string>('');
  const [interceptedTx, setInterceptedTx] = useState<any>(null);

  // Directly check browser extension availability client-side
  const getProvider = () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return null;
  };

  // Connect directly via standard browser provider parameters
  const connectInjectedWallet = async () => {
    const ethereum = getProvider();
    if (!ethereum) {
      alert('No Web3 wallet extension found. Please install MetaMask or Trust Wallet.');
      return;
    }
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      // Force user's browser wallet extension straight to BSC Testnet (Chain ID 97)
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }], // Hex representation of 97
      });
      if (accounts && accounts.length > 0) {
        setCurrentAddress(accounts[0]);
      }
    } catch (err: any) {
      console.error('Wallet connection encountered a problem:', err.message);
    }
  };

  // Background message event listener framework to capture custom app iframe communications
  useEffect(() => {
    const handleSafeAppMessage = (event: MessageEvent) => {
      if (event.data && event.data.params && event.data.method === 'sendTransactions') {
        const txsArray = event.data.params.txs;
        if (txsArray && txsArray.length > 0) {
          setInterceptedTx(txsArray); // Grab the raw transaction hex metadata payload
          alert("Transaction request captured from your custom app! Proceed to Step 1 below to generate your JSON signature file.");
        }
      }
    };

    window.addEventListener('message', handleSafeAppMessage);
    return () => window.removeEventListener('message', handleSafeAppMessage);
  }, []);

  const handleConnectSafe = (e: React.FormEvent) => {
    e.preventDefault();
    if (safeAddressInput.trim().startsWith('0x')) {
      setActiveSafeAddress(safeAddressInput.trim());
    } else {
      alert('Please enter a valid Ethereum-style hex contract address (starting with 0x)');
    }
  };

  const isWalletConnected = currentAddress !== '';

  return (
    <>
      <Head>
        {/* 💡 FIXED: Stripped curly braces from Wallet so it parses as regular string text */}
        <title>Safe{`{Wallet}`} – Local Chapel Workspace</title>
      </Head>

      <main style={{ padding: '40px 20px', minHeight: '100vh', backgroundColor: '#0F1011', fontFamily: 'Inter, sans-serif' }}>
        
        {/* Connection Status Topbar */}
        <div style={{ maxWidth: '600px', margin: '0 auto 20px auto', padding: '16px 24px', backgroundColor: '#1E2022', borderRadius: '12px', border: '1px solid #2E3033', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#A1A8B3', fontSize: '13px' }}>Signer Wallet Connection Status:</span>
            <div style={{ color: isWalletConnected ? '#80FFAD' : '#FF8085', fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
              {isWalletConnected ? `Connected: ${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}` : 'Disconnected'}
            </div>
          </div>
          
          {!isWalletConnected ? (
            <button onClick={connectInjectedWallet} style={{ backgroundColor: '#F0B90B', color: '#121314', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Connect Wallet
            </button>
          ) : (
            <button onClick={() => setCurrentAddress('')} style={{ backgroundColor: 'transparent', color: '#FF8085', border: '1px solid #FF8085', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Disconnect
            </button>
          )}
        </div>

        {/* Dynamic Multi-Sig Operational Context Panels */}
        {!activeSafeAddress ? (
          <div style={{ backgroundColor: '#121314', color: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #2E3033', maxWidth: '600px', margin: '0 auto', boxShadow: '0px 4px 20px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#F0B90B' }}>Target Safe Wallet Selection</h3>
            <p style={{ color: '#A1A8B3', fontSize: '13px', margin: '0 0 20px 0' }}>Enter the contract multi-sig deployment address instance you wish to execute transaction payloads against on the Chapel Testnet network layer.</p>
            
            <form onSubmit={handleConnectSafe}>
              <input 
                type="text" 
                value={safeAddressInput} 
                onChange={(e) => setSafeAddressInput(e.target.value)} 
                placeholder="0x..." 
                style={{ width: '100%', backgroundColor: '#1E2022', color: '#FFFFFF', border: '1px solid #2E3033', borderRadius: '8px', padding: '12px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }}
              />
              <button type="submit" disabled={!isWalletConnected} style={{ backgroundColor: isWalletConnected ? '#F0B90B' : '#4E4426', color: '#121314', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: isWalletConnected ? 'pointer' : 'not-allowed', fontWeight: 600, width: '100%' }}>
                {isWalletConnected ? 'Initialize Workspace Interface' : 'Please Connect Your Wallet First'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <button onClick={() => setActiveSafeAddress('')} style={{ background: 'none', border: 'none', color: '#A1A8B3', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }}>
                ← Change Selected Target Safe Contract Address
              </button>
            </div>
            {/* Mount the file management engine utility directly */}
            <FileBasedMultisig provider={getProvider()} safeAddress={activeSafeAddress} customAppTxData={interceptedTx} />

            {/* Custom App Frame Sandbox Container Element */}
            <div style={{ maxWidth: '600px', margin: '30px auto 0 auto', border: '1px dashed #2E3033', borderRadius: '12px', padding: '20px', backgroundColor: '#090A0A', textAlign: 'center' }}>
              <p style={{ color: '#A1A8B3', fontSize: '13px' }}>Custom App Sandboxed Context Workspace (`iframe` Simulation Container)</p>
              {/* Overwrite this target URL with your live deployed app link parameter settings later */}
              <iframe 
                src="https://uniswap.org" 
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
