import mongoose from 'mongoose';

const LoanSchema = new mongoose.Schema({
  // User Information
  walletAddress: {
    type: String,
    required: true,
    index: true,
    lowercase: true
  },
  
  // Loan Details
  loanId: {
    type: String,
    required: true,
    unique: true
  },
  
  principal: {
    type: Number,
    required: true
  },
  
  termDays: {
    type: Number,
    required: true
  },
  
  interestRate: {
    type: Number,
    required: true
  },
  
  // Timestamps
  borrowedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  repaidAt: {
    type: Date,
    default: null
  },
  
  // Transaction Hashes
  borrowTxHash: {
    type: String,
    required: true
  },
  
  repayTxHash: {
    type: String,
    default: null
  },
  
  // Repayment Details
  interestPaid: {
    type: Number,
    default: 0
  },
  
  principalPaid: {
    type: Number,
    default: 0
  },
  
  totalRepaid: {
    type: Number,
    default: 0
  },
  
  earlyRepaymentBonus: {
    type: Boolean,
    default: false
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'repaid', 'partial'],
    default: 'active'
  },
  
  // Credit Limit at time of borrow
  creditLimitAtBorrow: {
    type: Number,
    required: true
  },
  
  // Network
  network: {
    type: String,
    default: 'sepolia'
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

// Indexes for efficient queries
LoanSchema.index({ walletAddress: 1, borrowedAt: -1 });
LoanSchema.index({ status: 1 });
LoanSchema.index({ loanId: 1 });

export default mongoose.models.Loan || mongoose.model('Loan', LoanSchema);
