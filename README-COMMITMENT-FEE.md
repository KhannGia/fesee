# StreamCredit - Hệ Thống Commitment Fee

## 📋 Tổng Quan

StreamCredit là lending protocol dựa trên ZK fraud detection với reverse interest curve và **commitment fee tích lũy**.

---

## 💰 Commitment Fee - Giải Thích Chi Tiết

### 🤔 Commitment Fee Là Gì?

**Commitment Fee** là phí duy trì quyền truy cập vào credit line (hạn mức tín dụng). Đây là chi phí để "giữ chỗ" credit limit ngay cả khi bạn chưa vay.

### 📊 Cách Tính Commitment Fee

```
Commitment Fee = Available Credit × 0.5% APR × Time Elapsed
```

**Trong đó:**
- **Available Credit** = Credit Limit - Borrowed Amount
- **0.5% APR** = Lãi suất hàng năm cố định
- **Time Elapsed** = Thời gian từ lần trả phí cuối đến hiện tại

### 🎯 Tại Sao Phải Chia Nhiều Lần Trả?

#### 1️⃣ **Linh Hoạt Về Thời Gian**
- User có thể chọn lúc nào trả phí (hàng tuần, hàng tháng, hoặc khi thuận tiện)
- Không bắt buộc phải trả ngay lập tức
- Giống như hóa đơn điện nước - tích lũy theo thời gian, trả định kỳ

#### 2️⃣ **Phản Ánh Thực Tế Sử Dụng**
- Fee tính dựa trên **available credit thực tế** (không phải số tiền vay)
- Khi borrow nhiều → available credit giảm → fee giảm
- Khi repay → available credit tăng → fee tăng

#### 3️⃣ **Tránh Overpayment**
- Nếu prepaid (trả trước): User trả phí cho cả kỳ hạn dù có thể repay sớm
- Với accumulated fee: Chỉ trả đúng thời gian thực tế sử dụng credit

#### 4️⃣ **Quản Lý Cash Flow Tốt Hơn**
- User không phải bỏ ra số tiền lớn một lần
- Có thể kiểm soát chi phí theo từng giai đoạn

---

## 📖 Ví Dụ Cụ Thể

### Scenario 1: Không Vay Tiền

```
Day 0:  Submit ZK proof → Credit limit = 10,000 USDC
        Available credit = 10,000 USDC
        
Day 30: Accumulated fee = 10,000 × 0.5% × (30/365) = 4.11 USDC
        → Click "Pay Commitment Fee" → Trả 4.11 USDC
        → lastCommitmentFeePayment reset về Day 30
        
Day 60: Accumulated fee = 10,000 × 0.5% × (30/365) = 4.11 USDC
        → Trả thêm 4.11 USDC
```

**Tổng phí 60 ngày:** 8.22 USDC

---

### Scenario 2: Vay 4,000 USDC

```
Day 0:  Credit limit = 10,000 USDC
        Available credit = 10,000 USDC
        
Day 1:  Borrow 4,000 USDC
        Available credit = 6,000 USDC (giảm xuống)
        
Day 31: Accumulated fee = 10,000 × 0.5% × (1/365) [Day 0-1]
                        + 6,000 × 0.5% × (30/365) [Day 1-31]
                        = 0.137 + 2.466 = 2.60 USDC
        → Trả 2.60 USDC
        
Day 61: Repay full 4,000 USDC
        Available credit = 10,000 USDC (tăng lên)
        
Day 91: Accumulated fee = 6,000 × 0.5% × (30/365) [Day 61-91]
                        + 10,000 × 0.5% × (0/365) [chưa đủ tháng]
                        = 2.47 USDC
        → Trả 2.47 USDC
```

**Lợi ích:** Chỉ trả phí cao (10k) khi không vay, trả phí thấp (6k) khi đang vay.

---

### Scenario 3: So Sánh Với Prepaid (Trả Trước)

#### Prepaid Model (Cũ - Đã Bỏ):
```
Day 1:  Borrow 4,000 USDC for 30 days
        Available credit = 6,000 USDC
        Prepaid fee = 6,000 × 0.5% × (30/365) = 2.47 USDC
        → Bị trích ngay khi vay
        → Nhận 4,000 - 2.47 = 3,997.53 USDC
        
Day 5:  Repay full (sớm 25 ngày)
        → Được hoàn 2.47 USDC
        
❌ Vấn đề: Phức tạp, tiền bị "giữ" tạm thời
```

#### Accumulated Model (Mới - Hiện Tại):
```
Day 1:  Borrow 4,000 USDC
        → Nhận đủ 4,000 USDC (không trích phí)
        
Day 5:  Repay full
        Accumulated fee = 6,000 × 0.5% × (4/365) = 0.33 USDC
        → Chỉ trả đúng 4 ngày sử dụng
        
✅ Lợi ích: Đơn giản, trả đúng thời gian thực tế
```

---

## 🔧 Technical Implementation

### Smart Contract Logic

```solidity
// Tính accumulated fee
function calculateCommitmentFee(address account) public view returns (uint256) {
    if (creditLimit[account] == 0) return 0;
    if (lastCommitmentFeePayment[account] == 0) return 0;
    
    // Available credit = Credit limit - Borrowed
    uint256 availableCredit = creditLimit[account] > borrowed[account] 
        ? creditLimit[account] - borrowed[account] 
        : 0;
    
    // Thời gian từ lần trả cuối
    uint256 timeElapsed = block.timestamp - lastCommitmentFeePayment[account];
    
    // Tính phí
    uint256 annualFee = (availableCredit * COMMITMENT_FEE_RATE) / BASIS_POINTS;
    uint256 fee = (annualFee * timeElapsed) / SECONDS_PER_YEAR;
    
    return fee;
}

// Trả commitment fee
function payCommitmentFee() external nonReentrant {
    uint256 fee = calculateCommitmentFee(msg.sender);
    require(fee > 0, "No commitment fee to pay");
    
    // Transfer USDC từ user → contract
    require(usdcToken.transferFrom(msg.sender, address(this), fee), "Transfer failed");
    
    // Reset timer: bắt đầu tính fee mới từ bây giờ
    lastCommitmentFeePayment[msg.sender] = block.timestamp;
    
    totalLiquidity += fee;
    emit CommitmentFeePaid(msg.sender, fee);
}
```

### Frontend Flow

```javascript
1. User click "Pay Commitment Fee"
2. Frontend tính accumulated fee từ contract
3. Auto-mint USDC if balance < fee + 50 USDC buffer
4. Approve unlimited USDC (MaxUint256)
5. Wait 2 seconds for blockchain state update
6. Call contract.payCommitmentFee()
7. Contract resets lastCommitmentFeePayment
```

---

## 🎯 Lợi Ích Của Accumulated Fee Model

### ✅ Cho User
1. **Linh hoạt**: Trả khi nào cũng được (không bị ép buộc)
2. **Công bằng**: Chỉ trả đúng thời gian sử dụng
3. **Tiết kiệm**: Không bị overpay khi repay sớm
4. **Dễ hiểu**: Logic đơn giản như hóa đơn hàng tháng

### ✅ Cho Protocol
1. **Thu phí liên tục**: Dù user không vay cũng có revenue
2. **Khuyến khích sử dụng**: Fee thấp hơn khi đang vay (available credit giảm)
3. **Đơn giản hóa**: Không phải xử lý refund như prepaid model

---

## 📱 User Interface

### Hiển Thị Accumulated Fee
```
┌─────────────────────────────────────┐
│ 💰 Accumulated Fee                  │
│                                     │
│ $2.47 USDC                         │
│ 0.5% APR on available credit       │
│                                     │
│ [Pay Commitment Fee]               │
└─────────────────────────────────────┘
```

### Payment Panel (Khi có phí tích lũy)
```
┌─────────────────────────────────────────────┐
│ 🕐 Pay Commitment Fee                       │
│                                             │
│ You have an accumulated commitment fee of   │
│                                             │
│         $2.47 USDC                         │
│                                             │
│ This fee accrues at 0.5% APR on your       │
│ available credit (credit limit - borrowed). │
│                                             │
│ [Pay Commitment Fee →]                     │
└─────────────────────────────────────────────┘
```

---

## 🔄 Workflow Hoàn Chỉnh

```
1. Submit ZK Proof
   ↓
   ✅ Credit limit approved
   ✅ lastCommitmentFeePayment = block.timestamp
   
2. Borrow Money (Optional)
   ↓
   Available credit giảm → Fee tính trên số thấp hơn
   
3. Time Passes...
   ↓
   Fee tích lũy dựa trên available credit
   
4. Pay Commitment Fee
   ↓
   ✅ USDC transferred to contract
   ✅ lastCommitmentFeePayment reset
   ✅ Fee counter về 0, bắt đầu tích lũy lại
   
5. Repeat step 3-4 định kỳ
```

---

## 🆚 So Sánh Các Models

| Feature | Prepaid (Cũ) | Accumulated (Mới) |
|---------|--------------|-------------------|
| **Trả khi nào** | Khi borrow | Bất kỳ lúc nào |
| **Số tiền vay nhận được** | Bị trừ phí | Full amount |
| **Refund** | Có (phức tạp) | Không cần |
| **Overpayment** | Có thể xảy ra | Không |
| **Linh hoạt** | Thấp | Cao |
| **User experience** | Phức tạp | Đơn giản |
| **Cash flow** | Bị giữ tiền | Tự do |

---

## 🔐 Security & Best Practices

### Auto-Mint Protection
```javascript
// Frontend tự động mint USDC với buffer
const requiredBalance = fee + 50; // +50 USDC buffer
if (balanceUSDC < requiredBalance) {
  const needed = requiredBalance - balanceUSDC;
  await usdcContract.faucet(ethers.parseUnits(needed.toFixed(6), 6));
}
```

### Unlimited Approval (Avoid Precision Issues)
```javascript
// Approve unlimited thay vì exact amount
const maxUint256 = ethers.MaxUint256;
await usdcContract.approve(CONTRACTS.streamCredit, maxUint256);
```

### Gas Optimization
```javascript
// Manual gas limit để tránh estimateGas fail
const tx = await streamCreditContract.payCommitmentFee({ gasLimit: 250000 });
```

---

## 📊 Contract Addresses (Sepolia Testnet)

```
StreamCredit:  0x2295D08A08E6727C39E55d920eBDf17Bc20C6F34
MockUSDC:      0xcb3304FC69C2170970cf51981F4d8417A947Be90
MockVerifier:  0xa2C6D128130e135CC1d5c3AceF1eBF9ED8850454
```

---

## 🎓 Tại Sao Design Này Tốt?

### 1. **Real-world Banking Model**
- Giống phí duy trì tài khoản ngân hàng
- Tích lũy theo thời gian, trả định kỳ
- User đã quen với model này

### 2. **Incentive Alignment**
- Protocol muốn user vay tiền (vì có lãi)
- Fee thấp khi đang vay → khuyến khích borrow
- Fee cao khi không vay → khuyến khích sử dụng credit

### 3. **Fair Pricing**
- Trả đúng thời gian sử dụng
- Không bị overpay
- Transparent calculation

### 4. **Technical Simplicity**
- Không cần xử lý refund
- Không cần track prepaid deposits
- Gas efficient (ít storage writes)

---

## 🚀 Future Improvements

### 1. Auto-Payment
```solidity
// Tự động trừ fee từ credit limit khi quá hạn
if (block.timestamp > lastCommitmentFeePayment + 30 days) {
    uint256 fee = calculateCommitmentFee(msg.sender);
    creditLimit[msg.sender] -= fee;
}
```

### 2. Fee Discount Programs
```solidity
// Giảm phí cho loyal users
if (consecutivePayments[msg.sender] >= 12) {
    fee = fee * 90 / 100; // 10% discount
}
```

### 3. Fee Warnings
```javascript
// Alert user khi fee > threshold
if (accumulatedFee > 10) {
    showNotification("You have $" + accumulatedFee + " in fees");
}
```

---

## 📝 Summary

**Commitment Fee Model** sử dụng **accumulated charging** (tính tích lũy) thay vì **prepaid** (trả trước) vì:

✅ **Linh hoạt hơn** - User tự chọn thời điểm trả
✅ **Công bằng hơn** - Chỉ trả đúng thời gian sử dụng
✅ **Đơn giản hơn** - Không cần xử lý refund
✅ **Thực tế hơn** - Giống banking model quen thuộc
✅ **Incentive đúng** - Khuyến khích sử dụng credit

**Kết luận:** Đây là best practice trong fintech và DeFi! 🎯
