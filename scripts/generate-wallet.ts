import { ethers } from 'ethers';

/**
 * Script to create a new Ethereum wallet
 * Used to generate a new private key and address for testing
 */
function generateNewWallet() {
  // Create a random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log('✨ New wallet created:');
  console.log('🔑 Private Key:', wallet.privateKey);
  console.log('📬 Address:', wallet.address);
  console.log('🔐 Mnemonic:', wallet.mnemonic.phrase);
  
  console.log('\n⚠️ NOTE: This is only a test wallet, do not use for other purposes!');
  console.log('👉 Copy the private key to test-auth-api.ts file to test API');
}

// Run script
generateNewWallet(); 