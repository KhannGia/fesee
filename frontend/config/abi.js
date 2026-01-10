export const STREAM_CREDIT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_verifier", "type": "address"},
      {"internalType": "address", "name": "_usdcToken", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "borrower", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "term", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "interestRate", "type": "uint256"}
    ],
    "name": "Borrowed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "borrower", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "interest", "type": "uint256"},
      {"indexed": false, "internalType": "bool", "name": "earlyBonus", "type": "bool"}
    ],
    "name": "Repaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "borrower", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "CommitmentFeePaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "borrower", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "creditLimit", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "CreditVerified",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "uint256[2]", "name": "a", "type": "uint256[2]"},
      {"internalType": "uint256[2][2]", "name": "b", "type": "uint256[2][2]"},
      {"internalType": "uint256[2]", "name": "c", "type": "uint256[2]"},
      {"internalType": "uint256[1]", "name": "input", "type": "uint256[1]"},
      {"internalType": "uint256", "name": "revenue", "type": "uint256"}
    ],
    "name": "verifyAndUpdateCredit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "termDays", "type": "uint256"}
    ],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "repay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "repayFull",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "payCommitmentFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "addLiquidity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getAccountInfo",
    "outputs": [
      {"internalType": "uint256", "name": "_creditLimit", "type": "uint256"},
      {"internalType": "uint256", "name": "_borrowed", "type": "uint256"},
      {"internalType": "uint256", "name": "_available", "type": "uint256"},
      {"internalType": "uint256", "name": "_interest", "type": "uint256"},
      {"internalType": "uint256", "name": "_commitmentFee", "type": "uint256"},
      {"internalType": "uint256", "name": "_term", "type": "uint256"},
      {"internalType": "uint256", "name": "_interestRate", "type": "uint256"},
      {"internalType": "bool", "name": "_isEarly", "type": "bool"},
      {"internalType": "uint256", "name": "_lastFullRepayment", "type": "uint256"},
      {"internalType": "bool", "name": "_canBorrow", "type": "bool"},
      {"internalType": "uint256", "name": "_creditLimitExpiration", "type": "uint256"},
      {"internalType": "uint256", "name": "_daysUntilExpiration", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "termDays", "type": "uint256"}],
    "name": "getInterestRate",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "calculateCommitmentFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "calculateInterest",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "isEarlyRepayment",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserInfo",
    "outputs": [
      {"internalType": "uint256", "name": "_creditLimit", "type": "uint256"},
      {"internalType": "uint256", "name": "_borrowed", "type": "uint256"},
      {"internalType": "uint256", "name": "_available", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "creditLimit",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "borrowed",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalLiquidity",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

export const MOCK_USDC_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "faucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
]


export const COLLATERAL_NFT_ABI = [
    {
        "inputs":  [

                   ],
        "stateMutability":  "nonpayable",
        "type":  "constructor"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "sender",
                           "type":  "address"
                       },
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       },
                       {
                           "internalType":  "address",
                           "name":  "owner",
                           "type":  "address"
                       }
                   ],
        "name":  "ERC721IncorrectOwner",
        "type":  "error"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "operator",
                           "type":  "address"
                       },
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "ERC721InsufficientApproval",
        "type":  "error"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "approver",
                           "type":  "address"
                       }
                   ],
        "name":  "ERC721InvalidApprover",
        "type":  "error"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "operator",
                           "type":  "address"
                       }
                   ],
        "name":  "ERC721InvalidOperator",
        "type":  "error"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "owner",
                           "type":  "address"
                       }
                   ],
        "name":  "ERC721InvalidOwner",
        "type":  "error"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "receiver",
                           "type":  "address"
                       }
                   ],
        "name":  "ERC721InvalidReceiver",
        "type":  "error"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "sender",
                           "type":  "address"
                       }
                   ],
        "name":  "ERC721InvalidSender",
        "type":  "error"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "ERC721NonexistentToken",
        "type":  "error"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "owner",
                           "type":  "address"
                       }
                   ],
        "name":  "OwnableInvalidOwner",
        "type":  "error"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "account",
                           "type":  "address"
                       }
                   ],
        "name":  "OwnableUnauthorizedAccount",
        "type":  "error"
    },
    {
        "anonymous":  false,
        "inputs":  [
                       {
                           "indexed":  true,
                           "internalType":  "address",
                           "name":  "owner",
                           "type":  "address"
                       },
                       {
                           "indexed":  true,
                           "internalType":  "address",
                           "name":  "approved",
                           "type":  "address"
                       },
                       {
                           "indexed":  true,
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "Approval",
        "type":  "event"
    },
    {
        "anonymous":  false,
        "inputs":  [
                       {
                           "indexed":  true,
                           "internalType":  "address",
                           "name":  "owner",
                           "type":  "address"
                       },
                       {
                           "indexed":  true,
                           "internalType":  "address",
                           "name":  "operator",
                           "type":  "address"
                       },
                       {
                           "indexed":  false,
                           "internalType":  "bool",
                           "name":  "approved",
                           "type":  "bool"
                       }
                   ],
        "name":  "ApprovalForAll",
        "type":  "event"
    },
    {
        "anonymous":  false,
        "inputs":  [
                       {
                           "indexed":  false,
                           "internalType":  "uint256",
                           "name":  "_fromTokenId",
                           "type":  "uint256"
                       },
                       {
                           "indexed":  false,
                           "internalType":  "uint256",
                           "name":  "_toTokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "BatchMetadataUpdate",
        "type":  "event"
    },
    {
        "anonymous":  false,
        "inputs":  [
                       {
                           "indexed":  true,
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       },
                       {
                           "indexed":  true,
                           "internalType":  "address",
                           "name":  "lockedBy",
                           "type":  "address"
                       },
                       {
                           "indexed":  false,
                           "internalType":  "uint256",
                           "name":  "loanAmount",
                           "type":  "uint256"
                       },
                       {
                           "indexed":  false,
                           "internalType":  "uint256",
                           "name":  "lockedAt",
                           "type":  "uint256"
                       }
                   ],
        "name":  "CollateralLocked",
        "type":  "event"
    },
    {
        "anonymous":  false,
        "inputs":  [
                       {
                           "indexed":  true,
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       },
                       {
                           "indexed":  true,
                           "internalType":  "address",
                           "name":  "owner",
                           "type":  "address"
                       },
                       {
                           "indexed":  false,
                           "internalType":  "enum CollateralNFT.AssetType",
                           "name":  "assetType",
                           "type":  "uint8"
                       },
                       {
                           "indexed":  false,
                           "internalType":  "uint256",
                           "name":  "estimatedValue",
                           "type":  "uint256"
                       },
                       {
                           "indexed":  false,
                           "internalType":  "bytes32",
                           "name":  "fileHash",
                           "type":  "bytes32"
                       },
                       {
                           "indexed":  false,
                           "internalType":  "string",
                           "name":  "imageIPFSHash",
                           "type":  "string"
                       }
                   ],
        "name":  "CollateralMinted",
        "type":  "event"
    },
    {
        "anonymous":  false,
        "inputs":  [
                       {
                           "indexed":  true,
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       },
                       {
                           "indexed":  true,
                           "internalType":  "address",
                           "name":  "unlockedBy",
                           "type":  "address"
                       },
                       {
                           "indexed":  false,
                           "internalType":  "uint256",
                           "name":  "unlockedAt",
                           "type":  "uint256"
                       }
                   ],
        "name":  "CollateralUnlocked",
        "type":  "event"
    },
    {
        "anonymous":  false,
        "inputs":  [
                       {
                           "indexed":  true,
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       },
                       {
                           "indexed":  false,
                           "internalType":  "uint256",
                           "name":  "oldValue",
                           "type":  "uint256"
                       },
                       {
                           "indexed":  false,
                           "internalType":  "uint256",
                           "name":  "newValue",
                           "type":  "uint256"
                       }
                   ],
        "name":  "CollateralValueUpdated",
        "type":  "event"
    },
    {
        "anonymous":  false,
        "inputs":  [
                       {
                           "indexed":  false,
                           "internalType":  "uint256",
                           "name":  "_tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "MetadataUpdate",
        "type":  "event"
    },
    {
        "anonymous":  false,
        "inputs":  [
                       {
                           "indexed":  true,
                           "internalType":  "address",
                           "name":  "previousOwner",
                           "type":  "address"
                       },
                       {
                           "indexed":  true,
                           "internalType":  "address",
                           "name":  "newOwner",
                           "type":  "address"
                       }
                   ],
        "name":  "OwnershipTransferred",
        "type":  "event"
    },
    {
        "anonymous":  false,
        "inputs":  [
                       {
                           "indexed":  true,
                           "internalType":  "address",
                           "name":  "from",
                           "type":  "address"
                       },
                       {
                           "indexed":  true,
                           "internalType":  "address",
                           "name":  "to",
                           "type":  "address"
                       },
                       {
                           "indexed":  true,
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "Transfer",
        "type":  "event"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "to",
                           "type":  "address"
                       },
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "approve",
        "outputs":  [

                    ],
        "stateMutability":  "nonpayable",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "contractAddress",
                           "type":  "address"
                       },
                       {
                           "internalType":  "bool",
                           "name":  "authorized",
                           "type":  "bool"
                       }
                   ],
        "name":  "authorizeContract",
        "outputs":  [

                    ],
        "stateMutability":  "nonpayable",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "",
                           "type":  "address"
                       }
                   ],
        "name":  "authorizedContracts",
        "outputs":  [
                        {
                            "internalType":  "bool",
                            "name":  "",
                            "type":  "bool"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "owner",
                           "type":  "address"
                       }
                   ],
        "name":  "balanceOf",
        "outputs":  [
                        {
                            "internalType":  "uint256",
                            "name":  "",
                            "type":  "uint256"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "uint256",
                           "name":  "",
                           "type":  "uint256"
                       }
                   ],
        "name":  "collaterals",
        "outputs":  [
                        {
                            "internalType":  "string",
                            "name":  "assetName",
                            "type":  "string"
                        },
                        {
                            "internalType":  "enum CollateralNFT.AssetType",
                            "name":  "assetType",
                            "type":  "uint8"
                        },
                        {
                            "internalType":  "uint256",
                            "name":  "estimatedValue",
                            "type":  "uint256"
                        },
                        {
                            "internalType":  "string",
                            "name":  "description",
                            "type":  "string"
                        },
                        {
                            "internalType":  "string",
                            "name":  "imageIPFSHash",
                            "type":  "string"
                        },
                        {
                            "internalType":  "bytes32",
                            "name":  "fileHash",
                            "type":  "bytes32"
                        },
                        {
                            "internalType":  "uint256",
                            "name":  "uploadTimestamp",
                            "type":  "uint256"
                        },
                        {
                            "internalType":  "bool",
                            "name":  "isLocked",
                            "type":  "bool"
                        },
                        {
                            "internalType":  "address",
                            "name":  "lockedBy",
                            "type":  "address"
                        },
                        {
                            "internalType":  "uint256",
                            "name":  "lockedAt",
                            "type":  "uint256"
                        },
                        {
                            "internalType":  "uint256",
                            "name":  "loanAmount",
                            "type":  "uint256"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "bytes32",
                           "name":  "",
                           "type":  "bytes32"
                       }
                   ],
        "name":  "fileHashExists",
        "outputs":  [
                        {
                            "internalType":  "bool",
                            "name":  "",
                            "type":  "bool"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "bytes32",
                           "name":  "",
                           "type":  "bytes32"
                       }
                   ],
        "name":  "fileHashToTokenId",
        "outputs":  [
                        {
                            "internalType":  "uint256",
                            "name":  "",
                            "type":  "uint256"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "getApproved",
        "outputs":  [
                        {
                            "internalType":  "address",
                            "name":  "",
                            "type":  "address"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "getCollateralData",
        "outputs":  [
                        {
                            "components":  [
                                               {
                                                   "internalType":  "string",
                                                   "name":  "assetName",
                                                   "type":  "string"
                                               },
                                               {
                                                   "internalType":  "enum CollateralNFT.AssetType",
                                                   "name":  "assetType",
                                                   "type":  "uint8"
                                               },
                                               {
                                                   "internalType":  "uint256",
                                                   "name":  "estimatedValue",
                                                   "type":  "uint256"
                                               },
                                               {
                                                   "internalType":  "string",
                                                   "name":  "description",
                                                   "type":  "string"
                                               },
                                               {
                                                   "internalType":  "string",
                                                   "name":  "imageIPFSHash",
                                                   "type":  "string"
                                               },
                                               {
                                                   "internalType":  "bytes32",
                                                   "name":  "fileHash",
                                                   "type":  "bytes32"
                                               },
                                               {
                                                   "internalType":  "uint256",
                                                   "name":  "uploadTimestamp",
                                                   "type":  "uint256"
                                               },
                                               {
                                                   "internalType":  "bool",
                                                   "name":  "isLocked",
                                                   "type":  "bool"
                                               },
                                               {
                                                   "internalType":  "address",
                                                   "name":  "lockedBy",
                                                   "type":  "address"
                                               },
                                               {
                                                   "internalType":  "uint256",
                                                   "name":  "lockedAt",
                                                   "type":  "uint256"
                                               },
                                               {
                                                   "internalType":  "uint256",
                                                   "name":  "loanAmount",
                                                   "type":  "uint256"
                                               }
                                           ],
                            "internalType":  "struct CollateralNFT.Collateral",
                            "name":  "",
                            "type":  "tuple"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "getCollateralUtilization",
        "outputs":  [
                        {
                            "internalType":  "bool",
                            "name":  "isUsed",
                            "type":  "bool"
                        },
                        {
                            "internalType":  "address",
                            "name":  "lender",
                            "type":  "address"
                        },
                        {
                            "internalType":  "uint256",
                            "name":  "loanAmount",
                            "type":  "uint256"
                        },
                        {
                            "internalType":  "uint256",
                            "name":  "estimatedValue",
                            "type":  "uint256"
                        },
                        {
                            "internalType":  "uint256",
                            "name":  "ltvRatio",
                            "type":  "uint256"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "owner",
                           "type":  "address"
                       }
                   ],
        "name":  "getOwnedTokenIds",
        "outputs":  [
                        {
                            "internalType":  "uint256[]",
                            "name":  "",
                            "type":  "uint256[]"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "bytes32",
                           "name":  "fileHash",
                           "type":  "bytes32"
                       }
                   ],
        "name":  "getTokenIdByFileHash",
        "outputs":  [
                        {
                            "internalType":  "uint256",
                            "name":  "",
                            "type":  "uint256"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "owner",
                           "type":  "address"
                       },
                       {
                           "internalType":  "address",
                           "name":  "operator",
                           "type":  "address"
                       }
                   ],
        "name":  "isApprovedForAll",
        "outputs":  [
                        {
                            "internalType":  "bool",
                            "name":  "",
                            "type":  "bool"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "isCollateralLocked",
        "outputs":  [
                        {
                            "internalType":  "bool",
                            "name":  "",
                            "type":  "bool"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "bytes32",
                           "name":  "fileHash",
                           "type":  "bytes32"
                       }
                   ],
        "name":  "isFileTokenized",
        "outputs":  [
                        {
                            "internalType":  "bool",
                            "name":  "",
                            "type":  "bool"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       },
                       {
                           "internalType":  "uint256",
                           "name":  "loanAmount",
                           "type":  "uint256"
                       }
                   ],
        "name":  "lockCollateral",
        "outputs":  [

                    ],
        "stateMutability":  "nonpayable",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "to",
                           "type":  "address"
                       },
                       {
                           "internalType":  "string",
                           "name":  "assetName",
                           "type":  "string"
                       },
                       {
                           "internalType":  "enum CollateralNFT.AssetType",
                           "name":  "assetType",
                           "type":  "uint8"
                       },
                       {
                           "internalType":  "uint256",
                           "name":  "estimatedValue",
                           "type":  "uint256"
                       },
                       {
                           "internalType":  "string",
                           "name":  "description",
                           "type":  "string"
                       },
                       {
                           "internalType":  "string",
                           "name":  "imageIPFSHash",
                           "type":  "string"
                       },
                       {
                           "internalType":  "bytes32",
                           "name":  "fileHash",
                           "type":  "bytes32"
                       },
                       {
                           "internalType":  "string",
                           "name":  "metadataURI",
                           "type":  "string"
                       }
                   ],
        "name":  "mintCollateral",
        "outputs":  [
                        {
                            "internalType":  "uint256",
                            "name":  "",
                            "type":  "uint256"
                        }
                    ],
        "stateMutability":  "nonpayable",
        "type":  "function"
    },
    {
        "inputs":  [

                   ],
        "name":  "name",
        "outputs":  [
                        {
                            "internalType":  "string",
                            "name":  "",
                            "type":  "string"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [

                   ],
        "name":  "owner",
        "outputs":  [
                        {
                            "internalType":  "address",
                            "name":  "",
                            "type":  "address"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "ownerOf",
        "outputs":  [
                        {
                            "internalType":  "address",
                            "name":  "",
                            "type":  "address"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [

                   ],
        "name":  "renounceOwnership",
        "outputs":  [

                    ],
        "stateMutability":  "nonpayable",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "from",
                           "type":  "address"
                       },
                       {
                           "internalType":  "address",
                           "name":  "to",
                           "type":  "address"
                       },
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "safeTransferFrom",
        "outputs":  [

                    ],
        "stateMutability":  "nonpayable",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "from",
                           "type":  "address"
                       },
                       {
                           "internalType":  "address",
                           "name":  "to",
                           "type":  "address"
                       },
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       },
                       {
                           "internalType":  "bytes",
                           "name":  "data",
                           "type":  "bytes"
                       }
                   ],
        "name":  "safeTransferFrom",
        "outputs":  [

                    ],
        "stateMutability":  "nonpayable",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "operator",
                           "type":  "address"
                       },
                       {
                           "internalType":  "bool",
                           "name":  "approved",
                           "type":  "bool"
                       }
                   ],
        "name":  "setApprovalForAll",
        "outputs":  [

                    ],
        "stateMutability":  "nonpayable",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "bytes4",
                           "name":  "interfaceId",
                           "type":  "bytes4"
                       }
                   ],
        "name":  "supportsInterface",
        "outputs":  [
                        {
                            "internalType":  "bool",
                            "name":  "",
                            "type":  "bool"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [

                   ],
        "name":  "symbol",
        "outputs":  [
                        {
                            "internalType":  "string",
                            "name":  "",
                            "type":  "string"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "tokenURI",
        "outputs":  [
                        {
                            "internalType":  "string",
                            "name":  "",
                            "type":  "string"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "from",
                           "type":  "address"
                       },
                       {
                           "internalType":  "address",
                           "name":  "to",
                           "type":  "address"
                       },
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "transferFrom",
        "outputs":  [

                    ],
        "stateMutability":  "nonpayable",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "address",
                           "name":  "newOwner",
                           "type":  "address"
                       }
                   ],
        "name":  "transferOwnership",
        "outputs":  [

                    ],
        "stateMutability":  "nonpayable",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       }
                   ],
        "name":  "unlockCollateral",
        "outputs":  [

                    ],
        "stateMutability":  "nonpayable",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       },
                       {
                           "internalType":  "uint256",
                           "name":  "newValue",
                           "type":  "uint256"
                       }
                   ],
        "name":  "updateCollateralValue",
        "outputs":  [

                    ],
        "stateMutability":  "nonpayable",
        "type":  "function"
    },
    {
        "inputs":  [
                       {
                           "internalType":  "uint256",
                           "name":  "tokenId",
                           "type":  "uint256"
                       },
                       {
                           "internalType":  "bytes32",
                           "name":  "providedHash",
                           "type":  "bytes32"
                       }
                   ],
        "name":  "verifyFileIntegrity",
        "outputs":  [
                        {
                            "internalType":  "bool",
                            "name":  "",
                            "type":  "bool"
                        }
                    ],
        "stateMutability":  "view",
        "type":  "function"
    }
]
;
