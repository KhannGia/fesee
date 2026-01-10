#!/usr/bin/env node
/**
 * Script to update frontend contract addresses from deployed-addresses-mock.json
 * Usage: node scripts/update-addresses.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const DEPLOYED_ADDRESSES_PATH = path.join(__dirname, '../contracts/deployed-addresses-mock.json');
const WEB3_CONTEXT_PATH = path.join(__dirname, '../frontend/context/Web3Context.js');
const CONSTANTS_PATH = path.join(__dirname, '../frontend/config/constants.js');

console.log('🔄 Updating frontend contract addresses...\n');

// Read deployed addresses
if (!fs.existsSync(DEPLOYED_ADDRESSES_PATH)) {
  console.error('❌ Error: deployed-addresses-mock.json not found!');
  console.error('   Please deploy contracts first using:');
  console.error('   cd contracts && npx hardhat run scripts/deploy-mock.js --network sepolia');
  process.exit(1);
}

const deployed = JSON.parse(fs.readFileSync(DEPLOYED_ADDRESSES_PATH, 'utf8'));

console.log('📋 New addresses from deployment:');
console.log('   StreamCredit:', deployed.streamCredit);
console.log('   MockUSDC:', deployed.mockUSDC);
console.log('   MockVerifier:', deployed.mockVerifier);
console.log('   Network:', deployed.network);
console.log('   Deployed at:', deployed.deployedAt);
console.log();

// Update Web3Context.js
console.log('1️⃣ Updating Web3Context.js...');
let web3Context = fs.readFileSync(WEB3_CONTEXT_PATH, 'utf8');

const web3ContextRegex = /const CONTRACTS = \{[^}]*streamCredit: '[^']*',[^}]*mockUSDC: '[^']*',[^}]*mockVerifier: '[^']*',/s;
const web3ContextReplacement = `const CONTRACTS = {
  // MockVerifier deployment (for demo - always accepts proofs)
  streamCredit: '${deployed.streamCredit}',
  mockUSDC: '${deployed.mockUSDC}',
  mockVerifier: '${deployed.mockVerifier}',`;

if (web3ContextRegex.test(web3Context)) {
  web3Context = web3Context.replace(web3ContextRegex, web3ContextReplacement);
  fs.writeFileSync(WEB3_CONTEXT_PATH, web3Context, 'utf8');
  console.log('   ✅ Web3Context.js updated');
} else {
  console.log('   ⚠️  Could not find CONTRACTS object in Web3Context.js - please update manually');
}

// Update constants.js
console.log('2️⃣ Updating config/constants.js...');
let constants = fs.readFileSync(CONSTANTS_PATH, 'utf8');

const constantsRegex = /export const CONTRACTS = \{[^}]*streamCredit: '[^']*',[^}]*mockUSDC: '[^']*',[^}]*groth16Verifier: '[^']*'/s;
const constantsReplacement = `export const CONTRACTS = {
  streamCredit: '${deployed.streamCredit}',
  mockUSDC: '${deployed.mockUSDC}',
  groth16Verifier: '${deployed.mockVerifier}'  // MockVerifier - always returns true`;

if (constantsRegex.test(constants)) {
  constants = constants.replace(constantsRegex, constantsReplacement);
  fs.writeFileSync(CONSTANTS_PATH, constants, 'utf8');
  console.log('   ✅ constants.js updated');
} else {
  console.log('   ⚠️  Could not find CONTRACTS object in constants.js - please update manually');
}

console.log('\n✨ Frontend addresses updated successfully!');
console.log('💡 Remember to restart your frontend dev server if running');
