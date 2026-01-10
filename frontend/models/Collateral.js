import mongoose from 'mongoose';

const CollateralSchema = new mongoose.Schema({
  // User Information
  walletAddress: {
    type: String,
    required: true,
    index: true,
    lowercase: true
  },
  
  // NFT Details
  tokenId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  contractAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  
  // Asset Information
  assetName: {
    type: String,
    required: true
  },
  
  assetType: {
    type: Number, // 0-6 matching enum from contract
    required: true
  },
  
  assetTypeLabel: {
    type: String, // "Máy móc", "Hàng tồn kho", etc.
    required: true
  },
  
  estimatedValue: {
    type: Number, // USDC value (6 decimals)
    required: true
  },
  
  description: {
    type: String,
    default: ''
  },
  
  // IPFS Storage
  imageIPFSHash: {
    type: String,
    required: true
  },
  
  imageURL: {
    type: String,
    required: true
  },
  
  metadataURI: {
    type: String,
    required: true
  },
  
  // File Hash (for integrity check)
  fileHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Status
  isLocked: {
    type: Boolean,
    default: false
  },
  
  lockedBy: {
    type: String, // Contract address that locked it
    default: null,
    lowercase: true
  },
  
  lockedAt: {
    type: Date,
    default: null
  },
  
  loanAmount: {
    type: Number, // Amount borrowed against this collateral
    default: 0
  },
  
  ltvRatio: {
    type: Number, // Loan-to-Value ratio in basis points
    default: 0
  },
  
  // Timestamps
  mintedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Transaction Hashes
  mintTxHash: {
    type: String,
    required: true
  },
  
  lockTxHash: {
    type: String,
    default: null
  },
  
  unlockTxHash: {
    type: String,
    default: null
  },
  
  // Network
  network: {
    type: String,
    default: 'sepolia',
    enum: ['mainnet', 'sepolia', 'goerli']
  },
  
  // Metadata
  originalFilename: {
    type: String,
    default: ''
  },
  
  fileSize: {
    type: Number,
    default: 0
  },
  
  mimeType: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // Auto-manage createdAt and updatedAt
});

// Indexes for faster queries
CollateralSchema.index({ walletAddress: 1, mintedAt: -1 });
CollateralSchema.index({ isLocked: 1 });
CollateralSchema.index({ tokenId: 1, contractAddress: 1 });

// Virtual field for formatted value
CollateralSchema.virtual('formattedValue').get(function() {
  return (this.estimatedValue / 1e6).toFixed(2); // Convert from 6 decimals
});

// Method to update lock status
CollateralSchema.methods.lock = function(contractAddress, loanAmount) {
  this.isLocked = true;
  this.lockedBy = contractAddress.toLowerCase();
  this.lockedAt = new Date();
  this.loanAmount = loanAmount;
  this.ltvRatio = Math.floor((loanAmount * 10000) / this.estimatedValue);
  this.updatedAt = new Date();
  return this.save();
};

// Method to unlock
CollateralSchema.methods.unlock = function() {
  this.isLocked = false;
  this.lockedBy = null;
  this.lockedAt = null;
  this.loanAmount = 0;
  this.ltvRatio = 0;
  this.updatedAt = new Date();
  return this.save();
};

// Method to update value
CollateralSchema.methods.updateValue = function(newValue) {
  this.estimatedValue = newValue;
  if (this.isLocked && this.loanAmount > 0) {
    this.ltvRatio = Math.floor((this.loanAmount * 10000) / newValue);
  }
  this.updatedAt = new Date();
  return this.save();
};

export default mongoose.models.Collateral || mongoose.model('Collateral', CollateralSchema);
