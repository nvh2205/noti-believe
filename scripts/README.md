# Blink Chat Backend - Test Scripts

Scripts to test the APIs of Blink Chat Backend.

## Installation

```bash
cd scripts
npm install
```

## Usage

### 1. Create a new Ethereum wallet for testing

```bash
npm run generate-wallet
```

This script will create a new Ethereum wallet, including:
- Private key
- Wallet address
- Mnemonic phrase

Copy the generated private key to the `test-auth-api.ts` file for the next step.

### 2. Test login API with Binance Wallet

```bash
npm run test-auth
```

This script will:
1. Create a wallet from the configured private key
2. Call the `/auth/nonce` API to get a nonce
3. Sign a message containing the nonce with the private key
4. Call the `/auth/login` API to log in
5. Display the JWT token and user information received

## Notes

- Ensure the server is running before testing
- By default, the API URL is `http://localhost:3000`, if needed, change it in the `test-auth-api.ts` file
- The created wallets are for testing purposes only, do not use them in production environments 