// Script to help test login API with Binance Wallet in Insomnia
// To use:
// 1. Create a Pre-request Script in Insomnia
// 2. Paste this code
// 3. Create environment variables in Insomnia: 
//    - private_key: private key of Ethereum wallet
//    - address: Ethereum wallet address
//    - nonce: nonce from API /auth/nonce

const ethers = require('ethers');

// Get values from environment
const privateKey = environment.private_key;
const address = environment.address;
const nonce = environment.nonce;

// Check required values
if (!privateKey) {
  console.error('❌ Missing private_key in environment');
  return;
}

if (!nonce) {
  console.error('❌ Missing nonce - Call the API /auth/nonce first');
  return;
}

try {
  // Create wallet
  const wallet = new ethers.Wallet(privateKey);
  
  // Create message
  const message = `Sign this message to login with nonce: ${nonce}`;
  
  // Sign message
  const signature = await wallet.signMessage(message);
  
  // Send result to be used in request
  return {
    address: wallet.address,
    signature: signature
  };
} catch (error) {
  console.error('❌ Error signing message:', error.message);
} 