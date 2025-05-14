import axios, { AxiosError } from 'axios';
import { ethers } from 'ethers';

// Configuration
const API_URL = 'http://localhost:8000';
const PRIVATE_KEY = '0x11f55b8b0615deb08729bfe57d3139573e183eb0bd41a958bca2b9bb33b8ba86'; // Replace with private key created from generate-wallet script

// Check server connection before performing main operations
async function checkServerConnection(): Promise<boolean> {
  try {
    console.log(`🔍 Checking connection to server ${API_URL}...`);
    await axios.get(`${API_URL}/health`, { timeout: 5000 });
    console.log('✅ Successfully connected to server!');
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to server. Make sure the server is running.');
    if (axios.isAxiosError(error)) {
      console.error(`🔴 Error details: ${error.code || 'unknown'}`);
    }
    return false;
  }
}

async function main() {
  try {
    // Check server connection
    const isServerConnected = await checkServerConnection();
    if (!isServerConnected) {
      console.error('❌ Make sure the server is running before testing the API.');
      process.exit(1);
    }

    // Create wallet from private key
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const address = wallet.address;

    console.log('🔍 Wallet address:', address);

    // Call API to get nonce
    const nonceUrl = `${API_URL}/auth/nonce?address=${address}`;
    console.log(`🔄 Getting nonce from: ${nonceUrl}`);
    
    const nonceResponse = await axios.get(nonceUrl);
    
    console.log('📡 Received response:', JSON.stringify(nonceResponse.data));
    
    if (!nonceResponse.data.hasOwnProperty('nonce')) {
      throw new Error('Response from API does not contain nonce field');
    }
    
    const nonce = nonceResponse.data.nonce;
    console.log('✅ Successfully got nonce:', nonce);

    // Create message to sign
    const message = `Sign this message to login with nonce: ${nonce}`;
    console.log('📝 Message to sign:', message);

    // Sign message
    console.log('🔑 Signing message...');
    const signature = await wallet.signMessage(message);
    console.log('✅ Successfully signed message:', signature);

    // Call login API
    const loginUrl = `${API_URL}/auth/login`;
    console.log(`🔄 Logging in to: ${loginUrl}`);
    
    const loginData = { address, signature };
    console.log('📦 Data sent:', JSON.stringify(loginData));
    
    const loginResponse = await axios.post(loginUrl, loginData);

    // Show results
    console.log('✅ Login successful!');
    console.log('🔑 Access token:', loginResponse.data.access_token);
    console.log('👤 User information:', JSON.stringify(loginResponse.data.user, null, 2));

    return loginResponse.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('🔴 API Error:', error.message);
      console.error('🔗 URL:', error.config?.url);
      console.error('📋 Status:', error.response?.status);
      console.error('📄 Response:', JSON.stringify(error.response?.data || {}, null, 2));
    } else if (error instanceof Error) {
      console.error('🔴 Error:', error.message);
    } else {
      console.error('🔴 Unknown error:', error);
    }
    throw error;
  }
}

// Run script
main()
  .then((result) => {
    console.log('✨ Script completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Script failed!');
    process.exit(1);
  });