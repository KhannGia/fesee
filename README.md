#  FESEE - SME Credit Platform with Collateral Tokenization

> **Nền tảng tín dụng cho doanh nghiệp vừa và nhỏ (SME) với token hóa tài sản thế chấp trên blockchain**

Dự án FESEE là một giải pháp tín dụng phi tập trung sử dụng Zero-Knowledge Proof để xác minh doanh thu và NFT để token hóa tài sản thế chấp, giúp SME tiếp cận vốn dễ dàng hơn.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![Solidity](https://img.shields.io/badge/solidity-0.8.20-orange)

---

##  Mục lục

- [Tính năng chính](#-tính-năng-chính)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cài đặt & Cấu hình](#-cài-đặt--cấu-hình)
- [Hướng dẫn chạy](#-hướng-dẫn-chạy)
- [Smart Contracts](#-smart-contracts)
- [Đẩy lên GitHub](#-đẩy-lên-github)

---

##  Tính năng chính

### 1. **Zero-Knowledge Credit Verification**
- Xác minh doanh thu mà không tiết lộ dữ liệu nhạy cảm
- Sử dụng ZK-SNARK (Circom + SnarkJS)
- Phân tích Benford's Law để phát hiện gian lận

### 2. **Collateral NFT Tokenization**
- Token hóa tài sản thế chấp thành NFT (ERC-721)
- Lưu trữ hình ảnh tài sản trên IPFS (Thirdweb Storage)
- Tính toán file hash (SHA-256) để chống trùng lặp
- 7 loại tài sản: Máy móc, Hàng tồn kho, Bất động sản, Phương tiện, Hóa đơn, Khoản phải thu, Khác

### 3. **Smart Lending System**
- Vay USDC dựa trên credit limit
- Lãi suất động theo kỳ hạn (7-365 ngày)
- Commitment fee (1% credit limit)
- Phí trả nợ sớm (early repayment bonus)

### 4. **MongoDB Integration**
- Lưu trữ lịch sử vay vốn
- Quản lý collateral NFTs
- API endpoints cho query nhanh
- Dashboard analytics

---

##  Công nghệ sử dụng

### Blockchain & Smart Contracts
- **Solidity 0.8.20** - Smart contract language
- **Hardhat** - Development environment
- **Ethers.js v6** - Blockchain interaction
- **Sepolia Testnet** - Deployment network

### Frontend
- **Next.js 14** - React framework (App Router)
- **React 18** - UI library
- **TailwindCSS** - Styling
- **Recharts** - Data visualization

### Database & Storage
- **MongoDB Atlas** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Thirdweb Storage** - IPFS gateway

### Zero-Knowledge Proofs
- **Circom** - ZK circuit compiler
- **SnarkJS** - ZK proof generation/verification
- **Groth16** - Proving system

---

##  Cài đặt & Cấu hình

### 1. Clone Repository

```bash
git clone https://github.com/angianguyen/FESE.git
cd fesee-main
```

### 2. Cài đặt Dependencies

#### Smart Contracts
```bash
cd contracts
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Cấu hình Environment Variables

#### Frontend - Tạo file `frontend/.env.local`:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/fesee?retryWrites=true&w=majority

# Thirdweb IPFS Client ID (Get from: https://thirdweb.com/dashboard/settings/api-keys)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Contract Addresses (Sepolia Testnet)
NEXT_PUBLIC_STREAM_CREDIT_ADDRESS=0xD56e705D58F597B448610c17Da11598539917910
NEXT_PUBLIC_COLLATERAL_NFT_ADDRESS=0xae4857b09B590905A8eFc4AaDa4b169ACe335701
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0xF2349DF62365B214b5a8BD654D9CD8f47fe26009
NEXT_PUBLIC_MOCK_VERIFIER_ADDRESS=0x1E2905cCc01D83DF8074BdBa8a8bf839B69e6fE3

# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### Contracts - Tạo file `contracts/.env`:

```env
# Sepolia RPC URL (Get from Alchemy/Infura)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key

# Private Key (NEVER commit this!)
PRIVATE_KEY=your_wallet_private_key_without_0x_prefix

# Etherscan API Key (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

---

##  Hướng dẫn chạy

### A. Deploy Smart Contracts (Sepolia Testnet)

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy-mock.js --network sepolia
```

### B. Setup MongoDB

1. Tạo tài khoản MongoDB Atlas: https://www.mongodb.com/cloud/atlas
2. Tạo cluster mới (Free tier)
3. Tạo database user
4. Whitelist IP: `0.0.0.0/0` (cho development)
5. Copy connection string vào `frontend/.env.local`

### C. Chạy Frontend

```bash
cd frontend
npm run dev
```

Mở browser tại: `http://localhost:3000`

### D. Chạy Mock API (Optional)

```bash
cd mock-api
npm start
```

---

##  Smart Contracts

### Deployed Addresses (Sepolia Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **StreamCredit** | `0xD56e705D58F597B448610c17Da11598539917910` | Lending protocol |
| **CollateralNFT** | `0xae4857b09B590905A8eFc4AaDa4b169ACe335701` | NFT collateral |
| **MockUSDC** | `0xF2349DF62365B214b5a8BD654D9CD8f47fe26009` | Test stablecoin |
| **MockVerifier** | `0x1E2905cCc01D83DF8074BdBa8a8bf839B69e6fE3` | ZK proof verifier |

---

##  Đẩy lên GitHub

### 1. Tạo file `.gitignore`

```bash
# Dependencies
node_modules/

# Environment Variables
.env
.env.local
contracts/.env

# Next.js
.next/
out/
build/

# Production
*.log

# Hardhat
cache/
artifacts/

# ZK Circuit
*.zkey
*.r1cs
*.wasm

# IDE
.vscode/
.idea/

# OS
.DS_Store
```

### 2. Git Commands

```bash
# Initialize Git
git init

# Add all files
git add .

# Commit
git commit -m "feat: Complete FESEE platform with NFT collateral"

# Add remote
git remote add origin https://github.com/angianguyen/FESE.git

# Push
git branch -M main
git push -u origin main
```

---

##  Support

- **GitHub**: https://github.com/angianguyen/FESE
- **Issues**: https://github.com/angianguyen/FESE/issues

---

**Built with  by FESEE Team**
