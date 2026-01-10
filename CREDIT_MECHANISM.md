# StreamCredit Protocol - Credit Mechanism Documentation

## 📋 Tổng quan

StreamCredit là một lending protocol phi tập trung sử dụng ZK-proof để xác thực doanh thu và cấp tín dụng tự động. Protocol áp dụng **Reverse Interest Curve** - kỳ hạn ngắn hơn sẽ có lãi suất thấp hơn, khuyến khích người vay trả nợ sớm.

---

## 🎯 Cơ chế Credit Limit

### 1. Xác thực bằng ZK-Proof

Người dùng cần cung cấp ZK-proof chứng minh doanh thu của họ tuân theo quy luật Benford (không gian lận):

```solidity
function verifyAndUpdateCredit(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[1] memory input,
    uint256 revenue
) external
```

**Điều kiện:**
- ZK-proof phải hợp lệ (`verifier.verifyProof()` returns `true`)
- Public input `input[0]` phải bằng `1` (proof validation passed)
- Revenue phải > 0

### 2. Công thức tính Credit Limit

```
Credit Limit = Revenue × 30%
```

**Ví dụ:**
- Revenue: $100,000 → Credit Limit: $30,000
- Revenue: $500,000 → Credit Limit: $150,000

### 3. Auto-setup cho Testing

Trong phiên bản hiện tại, khi borrow lần đầu mà chưa có credit limit:

```solidity
if (creditLimit[msg.sender] == 0) {
    creditLimit[msg.sender] = amount * 2; // Tự động cấp 2x số tiền vay
    lastCommitmentFeePayment[msg.sender] = block.timestamp;
}
```

---

## 💰 Reverse Interest Curve

### Bảng lãi suất theo kỳ hạn

| Kỳ hạn (days) | Lãi suất APR | Constant |
|---------------|--------------|----------|
| 7-30 days     | **5%**       | `SHORT_TERM_RATE = 500` (basis points) |
| 31-90 days    | **8%**       | `MEDIUM_TERM_RATE = 800` |
| 91-180 days   | **15%**      | `LONG_TERM_RATE = 1500` |
| 181-365 days  | **25%**      | `VERY_LONG_TERM_RATE = 2500` |

### Công thức xác định lãi suất

```solidity
function getInterestRate(uint256 termDays) public pure returns (uint256) {
    if (termDays <= 30) return 5;      // 5% APR
    if (termDays <= 90) return 8;      // 8% APR
    if (termDays <= 180) return 15;    // 15% APR
    return 25;                          // 25% APR
}
```

### Tính lãi tích lũy

```solidity
function calculateInterest(address borrower) public view returns (uint256) {
    uint256 principal = borrowed[borrower];
    uint256 timeElapsed = block.timestamp - borrowTimestamp[borrower];
    uint256 rate = getInterestRate(borrowTerm[borrower]);
    
    // interest = principal × rate × timeElapsed / (10000 × 365 days)
    return (principal * rate * timeElapsed) / (BASIS_POINTS * SECONDS_PER_YEAR);
}
```

**Công thức:**
```
Interest = Principal × (Rate/10000) × (TimeElapsed / 365 days)
```

**Ví dụ:**
- Principal: 10,000 USDC
- Term: 30 days (rate = 5%)
- Time elapsed: 30 days

```
Interest = 10,000 × (500/10,000) × (30/365)
         = 10,000 × 0.05 × 0.0822
         = 41.1 USDC
```

---

## 💳 Commitment Fee

### Cơ chế

Commitment Fee là phí duy trì credit limit, tính trên **credit limit** (không phải số tiền vay):

```
Commitment Fee Rate = 0.5% APR (50 basis points)
```

### Công thức tính

```solidity
function calculateCommitmentFee(address borrower) public view returns (uint256) {
    uint256 limit = creditLimit[borrower];
    uint256 lastPayment = lastCommitmentFeePayment[borrower];
    
    if (lastPayment == 0 || limit == 0) return 0;
    
    uint256 timeElapsed = block.timestamp - lastPayment;
    
    // fee = creditLimit × 0.5% × timeElapsed / 365 days
    return (limit * COMMITMENT_FEE_RATE * timeElapsed) / (BASIS_POINTS * SECONDS_PER_YEAR);
}
```

**Công thức:**
```
Commitment Fee = Credit Limit × 0.005 × (TimeElapsed / 365 days)
```

**Ví dụ:**
- Credit Limit: 50,000 USDC
- Time since last payment: 90 days

```
Fee = 50,000 × (50/10,000) × (90/365)
    = 50,000 × 0.005 × 0.2466
    = 61.65 USDC
```

### Thanh toán Commitment Fee

```solidity
function payCommitmentFee() external nonReentrant
```

- Yêu cầu approve USDC trước khi gọi
- Fee được cộng vào `totalLiquidity`
- Reset `lastCommitmentFeePayment[msg.sender] = block.timestamp`

---

## 🎁 Early Repayment Bonus

### Điều kiện

Người vay được giảm **2% trên lãi** nếu trả nợ trước 50% thời hạn:

```solidity
function isEarlyRepayment(address borrower) public view returns (bool) {
    uint256 timeElapsed = block.timestamp - borrowTimestamp[borrower];
    uint256 halfTerm = (borrowTerm[borrower] * 1 days) / 2;
    return timeElapsed < halfTerm;
}
```

**Ví dụ:**
- Loan term: 60 days
- Time elapsed: 25 days
- Half term: 30 days
- → `25 < 30` → **Early repayment = TRUE** → 2% discount

### Áp dụng bonus

```solidity
if (isEarly) {
    interest = interest × (10000 - 200) / 10000;  // -2%
    interest = interest × 0.98;
}
```

**Ví dụ:**
- Original interest: 100 USDC
- Early bonus: 100 × 0.98 = **98 USDC** (tiết kiệm 2 USDC)

---

## 🔄 Repayment Logic

### Full Repayment

```solidity
function repay(uint256 amount) external
// amount = 0 → repay toàn bộ
```

**Luồng:**
1. Calculate `totalDebt = principal + interest`
2. Check balance & allowance
3. Transfer USDC từ user → contract
4. Reset: `borrowed[msg.sender] = 0`
5. Reset: `borrowTimestamp[msg.sender] = 0`
6. Reset: `borrowTerm[msg.sender] = 0`

### Partial Repayment

**Ưu tiên thanh toán: Interest → Principal**

```solidity
if (repayAmount <= interest) {
    // Chỉ trả lãi
    interestPaid = repayAmount;
    principalPaid = 0;
} else {
    // Trả hết lãi + một phần gốc
    interestPaid = interest;
    principalPaid = repayAmount - interest;
    borrowed[msg.sender] -= principalPaid;
}
```

**Ví dụ 1: Repay < Interest**
- Total debt: Principal = 1000, Interest = 300
- Repay amount: 200
- Result: `interestPaid = 200`, `principalPaid = 0`
- Remaining debt: 1000 (principal unchanged, interest still accruing)

**Ví dụ 2: Repay > Interest**
- Total debt: Principal = 1000, Interest = 300
- Repay amount: 500
- Result: `interestPaid = 300`, `principalPaid = 200`
- Remaining debt: 800 principal

---

## 🏊 Liquidity Pool

### Auto-mint cho Testing

Contract tự động mint USDC khi cần liquidity:

```solidity
function borrow(uint256 amount, uint256 termDays) external {
    // ...
    
    // Check if contract has enough USDC
    uint256 contractBalance = usdcToken.balanceOf(address(this));
    
    if (contractBalance < amount) {
        uint256 needed = amount * 3;
        IFaucet(address(usdcToken)).faucet(needed);
        totalLiquidity = usdcToken.balanceOf(address(this));
    }
    
    require(amount <= totalLiquidity, "Insufficient liquidity");
    totalLiquidity -= amount;
    
    usdcToken.transfer(msg.sender, amount);
}
```

### Liquidity Provider Functions

**Add Liquidity:**
```solidity
function addLiquidity(uint256 amount) external
```

**Remove Liquidity:**
```solidity
function removeLiquidity(uint256 amount) external
```

---

## 📊 Account Info Structure

```solidity
function getAccountInfo(address account) external view returns (
    uint256 creditLimit,        // Hạn mức tín dụng
    uint256 borrowed,            // Số tiền đã vay (principal)
    uint256 available,           // = creditLimit - borrowed
    uint256 interest,            // Lãi tích lũy
    uint256 commitmentFee,       // Commitment fee phải trả
    uint256 term,                // Kỳ hạn vay (days)
    uint256 interestRate,        // Lãi suất hiện tại (%)
    bool isEarlyRepayment       // Có được early bonus không
)
```

---

## 🔧 Constants & Configuration

```solidity
// Interest Rates (basis points, 1% = 100bp)
SHORT_TERM_RATE = 500       // 5%
MEDIUM_TERM_RATE = 800      // 8%
LONG_TERM_RATE = 1500       // 15%
VERY_LONG_TERM_RATE = 2500  // 25%

// Fees
COMMITMENT_FEE_RATE = 50    // 0.5%
EARLY_REPAY_BONUS = 200     // 2% discount

// Ratios
CREDIT_RATIO = 30           // 30% of revenue
BASIS_POINTS = 10000        // For percentage calculations
SECONDS_PER_YEAR = 31536000 // 365 days
```

---

## 💡 Best Practices

### Cho Borrowers

1. **Chọn kỳ hạn ngắn** để được lãi suất thấp (5% vs 25%)
2. **Trả nợ sớm** (trước 50% thời hạn) để được giảm 2% lãi
3. **Thanh toán commitment fee** định kỳ để tránh tích lũy
4. **Approve unlimited USDC** để tránh lỗi allowance khi repay

### Cho Developers

1. **Luôn check allowance** trước khi gọi contract functions
2. **Auto-mint USDC** trong frontend nếu user thiếu balance
3. **Set gas limit manually** khi call repay/payCommitmentFee để tránh estimateGas fail
4. **Refresh account info** sau mỗi transaction

---

## 📝 Example Workflow

### Complete Loan Cycle

```javascript
// 1. Verify ZK proof and get credit limit
await contract.verifyAndUpdateCredit(a, b, c, [1], revenue);
// → Credit limit = revenue × 30%

// 2. Borrow with 30-day term (5% APR)
await usdcContract.approve(contractAddress, maxUint256);
await contract.borrow(10000 * 1e6, 30); // 10,000 USDC, 30 days

// 3. After 25 days, repay early (get 2% bonus)
const accountInfo = await contract.getAccountInfo(userAddress);
const totalDebt = accountInfo.borrowed + accountInfo.interest;
// Interest ≈ 41.1 USDC → with 2% bonus = 40.3 USDC

await contract.repay(0); // 0 = full repayment
// Pay: 10,040.3 USDC
// Save: 0.8 USDC from early bonus

// 4. Pay commitment fee (if any)
const commitmentFee = await contract.calculateCommitmentFee(userAddress);
await contract.payCommitmentFee();
```

---

## 🚨 Security Considerations

1. **ReentrancyGuard** - Tất cả external functions có modifier `nonReentrant`
2. **Require checks** - Validate balance, allowance, credit limit
3. **Overflow protection** - Solidity 0.8+ tự động check overflow
4. **Access control** - `Ownable` cho admin functions
5. **ZK-proof validation** - Chỉ cấp credit khi proof hợp lệ

---

## 📞 Contract Addresses (Sepolia Testnet)

```
StreamCredit:  0x3924Cc58B31fB71fa3bed2B95D855130F1407513
MockUSDC:      0x4D6bB02E9E1Df85c8b6Ac5C6F2A793AEBAD5a23C
MockVerifier:  0x39344292FF61f06dd930f7b2e55fEE520fc496F3
```

---

## 📚 References

- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Benford's Law](https://en.wikipedia.org/wiki/Benford%27s_law)
- [ZK-SNARKs](https://z.cash/technology/zksnarks/)
