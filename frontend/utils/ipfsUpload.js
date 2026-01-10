/**
 * IPFS Upload Helper using Thirdweb Storage
 * Get Client ID from: https://thirdweb.com/dashboard/settings/api-keys
 */

import { ThirdwebStorage } from '@thirdweb-dev/storage';

// Thirdweb Client ID from .env (public, safe to expose)
const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

// Initialize Thirdweb Storage
let storage;
try {
  if (!THIRDWEB_CLIENT_ID) {
    console.warn('⚠️ Thirdweb Client ID missing!');
    console.warn('Add to .env.local: NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id');
    console.warn('Get from: https://thirdweb.com/dashboard/settings/api-keys');
  } else {
    storage = new ThirdwebStorage({
      clientId: THIRDWEB_CLIENT_ID,
    });
    console.log('✅ Thirdweb Storage initialized');
  }
} catch (error) {
  console.error('❌ Failed to initialize Thirdweb Storage:', error);
}

/**
 * Calculate SHA-256 hash from file
 * @param {File} file - File object from input
 * @returns {Promise<string>} - Hex string of SHA-256 hash (0x...)
 */
export async function calculateFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex; // Return as bytes32 format for Solidity
}

/**
 * Upload image to IPFS via Thirdweb Storage
 * @param {File} imageFile - Image file to upload
 * @param {Object} metadata - Collateral metadata
 * @returns {Promise<Object>} - { imageCID, metadataCID, metadataURI, imageURL, metadataURL }
 */
export async function uploadToIPFS(imageFile, metadata) {
  if (!storage) {
    throw new Error('Thirdweb Storage not initialized. Please add NEXT_PUBLIC_THIRDWEB_CLIENT_ID to .env.local');
  }
  
  try {
    console.log('📤 Uploading to Thirdweb IPFS...');
    
    // 1. Upload image file
    console.log('Uploading image:', imageFile.name);
    const imageUri = await storage.upload(imageFile);
    const imageCID = imageUri.replace('ipfs://', '');
    console.log('✅ Image uploaded:', imageCID);
    
    // 2. Create metadata JSON
    const nftMetadata = {
      name: metadata.assetName,
      description: metadata.description,
      image: imageUri, // ipfs:// format
      properties: {
        asset_type: metadata.assetType,
        estimated_value: metadata.estimatedValue,
        file_hash: metadata.fileHash,
        upload_timestamp: Date.now(),
        original_filename: imageFile.name,
        file_size: imageFile.size,
        mime_type: imageFile.type
      }
    };
    
    // 3. Upload metadata JSON
    console.log('Uploading metadata...');
    const metadataUri = await storage.upload(nftMetadata);
    const metadataCID = metadataUri.replace('ipfs://', '');
    console.log('✅ Metadata uploaded:', metadataCID);
    
    // Use Thirdweb gateway for faster loading
    const imageGatewayURL = storage.resolveScheme(imageUri);
    
    return {
      imageCID,
      metadataCID,
      metadataURI: metadataUri, // ipfs://...
      imageURL: imageGatewayURL, // Thirdweb gateway for faster loading
      metadataURL: storage.resolveScheme(metadataUri)
    };
  } catch (error) {
    console.error('❌ IPFS upload failed:', error);
    throw new Error('Failed to upload to IPFS: ' + error.message);
  }
}

/**
 * Verify file integrity by comparing hashes
 * @param {File} file - File to verify
 * @param {string} expectedHash - Expected hash from blockchain
 * @returns {Promise<boolean>} - True if hashes match
 */
export async function verifyFileIntegrity(file, expectedHash) {
  const actualHash = await calculateFileHash(file);
  return actualHash.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * Get IPFS gateway URL for display
 * @param {string} ipfsCID - IPFS CID or ipfs:// URI
 * @returns {string} - Gateway URL
 */
export function getIPFSGatewayURL(ipfsCID) {
  const cid = ipfsCID.replace('ipfs://', '');
  // Use Thirdweb's fast gateway
  return `https://${cid}.ipfs.thirdwebstorage.com`;
}

/**
 * Download from IPFS
 * @param {string} ipfsUri - IPFS URI (ipfs://...)
 * @returns {Promise<Response>} - Fetch response
 */
export async function downloadFromIPFS(ipfsUri) {
  if (!storage) {
    // Fallback to public gateway
    const cid = ipfsUri.replace('ipfs://', '');
    return fetch(`https://ipfs.io/ipfs/${cid}`);
  }
  
  const url = storage.resolveScheme(ipfsUri);
  return fetch(url);
}
