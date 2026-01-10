// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Import Verifier contract (sẽ được generate từ ZK circuit)
interface IVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[1] memory input
    ) external view returns (bool);
}

// Import MockUSDC faucet for testing
interface IFaucet {
    function faucet(uint256 amount) external;
}

/**
 * @title StreamCredit
 * @notice Lending protocol dựa trên dòng tiền thời gian thực với ZK fraud detection
 */
contract StreamCredit is Ownable, ReentrancyGuard {
    IVerifier public verifier;
    IERC20 public usdcToken;
    
    // Credit limit cho mỗi borrower
    mapping(address => uint256) public creditLimit;
    
    // Thời hạn cuối của credit limit (1 năm từ khi verify ZK proof)
    mapping(address => uint256) public creditLimitExpiration;
    
    // Số tiền đã vay
    mapping(address => uint256) public borrowed;
    
    // Thời điểm vay
    mapping(address => uint256) public borrowTimestamp;
    
    // Kỳ hạn vay (số ngày)
    mapping(address => uint256) public borrowTerm;
    
    // Commitment fee đã trả lần cuối
    mapping(address => uint256) public lastCommitmentFeePayment;
    
    // Commitment fee deposit (trích từ số tiền vay, sẽ hoàn lại khi repay)
    mapping(address => uint256) public commitmentFeeDeposit;
    
    // Last full repayment timestamp (để enforce cooldown period)
    mapping(address => uint256) public lastFullRepayment;
    
    // Reverse Interest Curve: Lãi suất theo kỳ hạn
    uint256 public constant SHORT_TERM_RATE = 500; // 5% APR (7-30 days)
    uint256 public constant MEDIUM_TERM_RATE = 800; // 8% APR (31-90 days)
    uint256 public constant LONG_TERM_RATE = 1500; // 15% APR (91-180 days)
    uint256 public constant VERY_LONG_TERM_RATE = 2500; // 25% APR (181-365 days)
    
    // Commitment Fee: 0.5% annual on credit limit
    uint256 public constant COMMITMENT_FEE_RATE = 50; // 0.5% (50 basis points)
    
    // Early Repayment Bonus
    uint256 public constant EARLY_REPAY_BONUS = 200; // 2% discount
    
    // Cooldown period sau khi trả hết nợ (5 ngày)
    uint256 public constant COOLDOWN_PERIOD = 5 days;
    
    // Credit limit validity period (1 năm)
    uint256 public constant CREDIT_LIMIT_VALIDITY = 365 days;
    
    // Tỷ lệ credit limit trên revenue (30%)
    uint256 public constant CREDIT_RATIO = 30;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    // Liquidity pool
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidityProvided;
    
    // Events
    event CreditVerified(address indexed borrower, uint256 creditLimit, uint256 timestamp);
    event Borrowed(address indexed borrower, uint256 amount, uint256 term, uint256 interestRate);
    event Repaid(address indexed borrower, uint256 amount, uint256 interest, bool earlyBonus);
    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event CommitmentFeePaid(address indexed borrower, uint256 amount);
    
    constructor(address _verifier, address _usdcToken) Ownable(msg.sender) {
        verifier = IVerifier(_verifier);
        usdcToken = IERC20(_usdcToken);
    }
    
    /**
     * @notice Verify ZK proof và cập nhật credit limit
     * @param a, b, c: ZK proof components
     * @param input: Public inputs (isValid output)
     * @param revenue: Doanh thu (để tính credit limit nếu proof valid)
     */
    function verifyAndUpdateCredit(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[1] memory input,
        uint256 revenue
    ) external {
        // Verify ZK proof
        require(verifier.verifyProof(a, b, c, input), "Invalid ZK proof");
        
        // Check if proof is valid (input[0] should be 1)
        require(input[0] == 1, "Proof validation failed");
        
        // Calculate credit limit = 30% of revenue
        uint256 newCreditLimit = (revenue * CREDIT_RATIO) / 100;
        
        // Update credit limit and set expiration to 1 year from now
        creditLimit[msg.sender] = newCreditLimit;
        creditLimitExpiration[msg.sender] = block.timestamp + CREDIT_LIMIT_VALIDITY;
        lastCommitmentFeePayment[msg.sender] = block.timestamp;
        
        emit CreditVerified(msg.sender, newCreditLimit, block.timestamp);
    }
    
    /**
     * @notice Tính lãi suất dựa trên kỳ hạn (Reverse Interest Curve)
     * @param termDays: Số ngày vay
     * @return Lãi suất (basis points)
     */
    function getInterestRate(uint256 termDays) public pure returns (uint256) {
        if (termDays <= 30) {
            return SHORT_TERM_RATE; // 5%
        } else if (termDays <= 90) {
            return MEDIUM_TERM_RATE; // 8%
        } else if (termDays <= 180) {
            return LONG_TERM_RATE; // 15%
        } else {
            return VERY_LONG_TERM_RATE; // 25%
        }
    }
    
    /**
     * @notice Tính commitment fee đang tích luỹ (accumulated fee)
     * @dev Fee is calculated on available credit (creditLimit - borrowed) from lastCommitmentFeePayment to now
     * @param account: Địa chỉ người vay
     * @return Số tiền commitment fee đang tích luỹ
     */
    function calculateCommitmentFee(address account) public view returns (uint256) {
        if (creditLimit[account] == 0) return 0;
        if (lastCommitmentFeePayment[account] == 0) return 0;
        
        uint256 availableCredit = creditLimit[account] > borrowed[account] 
            ? creditLimit[account] - borrowed[account] 
            : 0;
        
        uint256 timeElapsed = block.timestamp - lastCommitmentFeePayment[account];
        uint256 annualFee = (availableCredit * COMMITMENT_FEE_RATE) / BASIS_POINTS;
        uint256 fee = (annualFee * timeElapsed) / SECONDS_PER_YEAR;
        
        return fee;
    }
    
    /**
     * @notice Tính commitment fee cho kỳ hạn vay (prepaid)
     * @dev Fee is calculated on available credit (creditLimit - borrowed), not on borrowed amount
     * @param availableCredit: Credit limit minus borrowed amount (what remains available)
     * @param termDays: Kỳ hạn vay (ngày)
     * @return Số tiền commitment fee cần trích
     */
    function calculatePrepaidCommitmentFee(uint256 availableCredit, uint256 termDays) public pure returns (uint256) {
        uint256 annualFee = (availableCredit * COMMITMENT_FEE_RATE) / BASIS_POINTS;
        uint256 fee = (annualFee * termDays) / 365;
        return fee;
    }
    
    /**
     * @notice Tính lãi phải trả
     * @param account: Địa chỉ người vay
     * @return Số tiền lãi
     */
    function calculateInterest(address account) public view returns (uint256) {
        if (borrowed[account] == 0) return 0;
        
        uint256 principal = borrowed[account];
        uint256 timeElapsed = block.timestamp - borrowTimestamp[account];
        uint256 rate = getInterestRate(borrowTerm[account]);
        
        uint256 annualInterest = (principal * rate) / BASIS_POINTS;
        uint256 interest = (annualInterest * timeElapsed) / SECONDS_PER_YEAR;
        
        return interest;
    }
    
    /**
     * @notice Kiểm tra có được early repayment bonus không
     * @param account: Địa chỉ người vay
     * @return true nếu trả sớm hơn kỳ hạn
     */
    function isEarlyRepayment(address account) public view returns (bool) {
        if (borrowTimestamp[account] == 0) return false;
        
        uint256 timeElapsed = (block.timestamp - borrowTimestamp[account]) / 1 days;
        return timeElapsed < borrowTerm[account];
    }
    
    /**
     * @notice Vay tiền với kỳ hạn cụ thể
     * @param amount: Số tiền muốn vay
     * @param termDays: Kỳ hạn vay (số ngày: 7-365)
     */
    function borrow(uint256 amount, uint256 termDays) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(termDays >= 7 && termDays <= 365, "Invalid term");
        require(borrowed[msg.sender] == 0, "Already have active loan");
        
        // Check cooldown period: phải duy trì total debt = 0 trong 5 ngày
        if (lastFullRepayment[msg.sender] > 0) {
            require(
                block.timestamp >= lastFullRepayment[msg.sender] + COOLDOWN_PERIOD,
                "Must wait 5 days after full repayment before borrowing again"
            );
        }
        
        // Auto setup for testing if no credit limit
        if (creditLimit[msg.sender] == 0) {
            creditLimit[msg.sender] = amount * 2; // Give 2x credit limit
            creditLimitExpiration[msg.sender] = block.timestamp + CREDIT_LIMIT_VALIDITY; // Set 1 year expiration
            lastCommitmentFeePayment[msg.sender] = block.timestamp;
        }
        
        // Check if credit limit is still valid
        require(
            block.timestamp < creditLimitExpiration[msg.sender],
            "Credit limit expired. Please submit new ZK proof to renew."
        );
        
        // Auto-adjust loan term to not exceed credit limit expiration
        // Người dùng vẫn vay được nhưng term sẽ tự động giảm về số ngày còn lại
        uint256 daysUntilExpiration = (creditLimitExpiration[msg.sender] - block.timestamp) / 1 days;
        uint256 actualTerm = termDays;
        
        if (termDays > daysUntilExpiration) {
            actualTerm = daysUntilExpiration;
        }
        
        require(actualTerm >= 7, "Insufficient time remaining on credit limit (min 7 days required)");
        
        require(
            borrowed[msg.sender] + amount <= creditLimit[msg.sender],
            "Exceeds credit limit"
        );
        
        // Check if contract has enough USDC
        uint256 contractBalance = usdcToken.balanceOf(address(this));
        
        // Auto mint USDC if contract doesn't have enough (for testing only)
        if (contractBalance < amount) {
            uint256 needed = amount + 10000 * 1e6; // Mint amount + 10000 USDC buffer
            
            // Mint USDC directly to this contract
            try IFaucet(address(usdcToken)).faucet(needed) {
                // Faucet successful, update liquidity
                totalLiquidity = usdcToken.balanceOf(address(this));
            } catch {
                revert("Failed to mint USDC - contract has insufficient balance");
            }
        }
        
        // Ensure we still have virtual liquidity tracking
        require(amount <= totalLiquidity, "Insufficient liquidity");
        
        borrowed[msg.sender] = amount;
        borrowTimestamp[msg.sender] = block.timestamp;
        borrowTerm[msg.sender] = actualTerm; // Lưu actualTerm, không phải termDays ban đầu
        totalLiquidity -= amount;
        
        uint256 rate = getInterestRate(actualTerm);
        
        // Transfer full amount to borrower (no prepaid fee deduction)
        require(usdcToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Borrowed(msg.sender, amount, actualTerm, rate);
    }
    
    /**
     * @notice Trả nợ (bao gồm cả lãi)
     */
    function repay(uint256 amount) external nonReentrant {
        require(borrowed[msg.sender] > 0, "No active loan");
        
        uint256 principal = borrowed[msg.sender];
        uint256 interest = calculateInterest(msg.sender);
        bool isEarly = isEarlyRepayment(msg.sender);
        
        // Apply early repayment bonus
        if (isEarly) {
            interest = (interest * (BASIS_POINTS - EARLY_REPAY_BONUS)) / BASIS_POINTS;
        }
        
        uint256 totalDebt = principal + interest;
        uint256 repayAmount = (amount == 0) ? totalDebt : amount;
        
        require(repayAmount <= totalDebt, "Amount exceeds total debt");
        require(usdcToken.balanceOf(msg.sender) >= repayAmount, "Insufficient USDC balance");
        require(usdcToken.allowance(msg.sender, address(this)) >= repayAmount, "Insufficient USDC allowance");
        
        // Transfer USDC from user to contract
        require(usdcToken.transferFrom(msg.sender, address(this), repayAmount), "Transfer failed");
        
        // Calculate how much goes to interest and principal
        // Standard practice: Pay interest first, then principal
        uint256 interestPaid;
        uint256 principalPaid;
        
        if (repayAmount >= totalDebt) {
            // Full repayment
            interestPaid = interest;
            principalPaid = principal;
            
            borrowed[msg.sender] = 0;
            borrowTimestamp[msg.sender] = 0;
            borrowTerm[msg.sender] = 0;
            lastFullRepayment[msg.sender] = block.timestamp; // Track full repayment time
        } else {
            // Partial repayment: pay interest first
            if (repayAmount <= interest) {
                // Payment only covers part of interest
                interestPaid = repayAmount;
                principalPaid = 0;
                // Don't reduce principal, but interest is partially paid
                // Note: This contract doesn't track accrued interest separately,
                // so partial interest payment doesn't reduce future interest
            } else {
                // Payment covers all interest plus some principal
                interestPaid = interest;
                principalPaid = repayAmount - interest;
                borrowed[msg.sender] -= principalPaid;
            }
        }
        
        totalLiquidity += repayAmount;
        
        emit Repaid(msg.sender, principalPaid, interestPaid, isEarly);
    }
    
    /**
     * @notice Repay loan in full (convenience function)
     */
    function repayFull() external nonReentrant {
        require(borrowed[msg.sender] > 0, "No active loan");
        
        uint256 principal = borrowed[msg.sender];
        uint256 interest = calculateInterest(msg.sender);
        bool isEarly = isEarlyRepayment(msg.sender);
        
        if (isEarly) {
            interest = (interest * (BASIS_POINTS - EARLY_REPAY_BONUS)) / BASIS_POINTS;
        }
        
        uint256 totalAmount = principal + interest;
        
        require(usdcToken.balanceOf(msg.sender) >= totalAmount, "Insufficient USDC balance");
        require(usdcToken.allowance(msg.sender, address(this)) >= totalAmount, "Insufficient USDC allowance");
        require(usdcToken.transferFrom(msg.sender, address(this), totalAmount), "Transfer failed");
        
        borrowed[msg.sender] = 0;
        borrowTimestamp[msg.sender] = 0;
        borrowTerm[msg.sender] = 0;
        lastFullRepayment[msg.sender] = block.timestamp; // Track full repayment time
        totalLiquidity += totalAmount;
        
        emit Repaid(msg.sender, principal, interest, isEarly);
    }
    
    /**
     * @notice Trả commitment fee tích luỹ
     * @dev Fee accumulates on available credit from lastCommitmentFeePayment to now
     */
    function payCommitmentFee() external nonReentrant {
        uint256 fee = calculateCommitmentFee(msg.sender);
        require(fee > 0, "No commitment fee to pay");
        
        require(usdcToken.balanceOf(msg.sender) >= fee, "Insufficient USDC balance");
        require(usdcToken.allowance(msg.sender, address(this)) >= fee, "Insufficient USDC allowance");
        
        // Transfer USDC from user to contract
        require(usdcToken.transferFrom(msg.sender, address(this), fee), "Transfer failed");
        
        // Reset lastCommitmentFeePayment to now
        lastCommitmentFeePayment[msg.sender] = block.timestamp;
        
        totalLiquidity += fee;
        
        emit CommitmentFeePaid(msg.sender, fee);
    }
    
    /**
     * @notice Thêm thanh khoản (liquidity provider)
     * @param amount: Số USDC cung cấp
     */
    function addLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        liquidityProvided[msg.sender] += amount;
        totalLiquidity += amount;
        
        emit LiquidityAdded(msg.sender, amount);
    }
    
    /**
     * @notice Rút thanh khoản
     * @param amount: Số tiền muốn rút
     */
    function removeLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(liquidityProvided[msg.sender] >= amount, "Insufficient balance");
        require(amount <= totalLiquidity, "Insufficient protocol liquidity");
        
        liquidityProvided[msg.sender] -= amount;
        totalLiquidity -= amount;
        
        require(usdcToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit LiquidityRemoved(msg.sender, amount);
    }
    
    /**
     * @notice Lấy thông tin tài khoản
     */
    function getAccountInfo(address account) 
        external 
        view 
        returns (
            uint256 _creditLimit,
            uint256 _borrowed,
            uint256 _available,
            uint256 _interest,
            uint256 _commitmentFee,
            uint256 _term,
            uint256 _interestRate,
            bool _isEarly,
            uint256 _lastFullRepayment,
            bool _canBorrow,
            uint256 _creditLimitExpiration,
            uint256 _daysUntilExpiration
        ) 
    {
        _creditLimit = creditLimit[account];
        _borrowed = borrowed[account];
        _available = _creditLimit > _borrowed ? _creditLimit - _borrowed : 0;
        _interest = calculateInterest(account);
        _commitmentFee = calculateCommitmentFee(account);
        _term = borrowTerm[account];
        _interestRate = borrowTerm[account] > 0 ? getInterestRate(borrowTerm[account]) : 0;
        _isEarly = isEarlyRepayment(account);
        _lastFullRepayment = lastFullRepayment[account];
        _creditLimitExpiration = creditLimitExpiration[account];
        
        // Calculate days until credit limit expiration
        if (_creditLimitExpiration > block.timestamp) {
            _daysUntilExpiration = (_creditLimitExpiration - block.timestamp) / 1 days;
        } else {
            _daysUntilExpiration = 0;
        }
        
        // Check if can borrow (no active loan + cooldown passed + credit limit valid OR not set yet)
        _canBorrow = (_borrowed == 0) && 
                     (_lastFullRepayment == 0 || block.timestamp >= _lastFullRepayment + COOLDOWN_PERIOD) &&
                     (_creditLimit == 0 || _creditLimitExpiration > block.timestamp);
    }
    
    /**
     * @notice Tính actual loan term sẽ được approve (có thể khác requested term nếu credit limit sắp hết hạn)
     * @param account: Địa chỉ người vay
     * @param requestedTerm: Kỳ hạn mong muốn (ngày)
     * @return Kỳ hạn thực tế sẽ được approve
     */
    function getActualLoanTerm(address account, uint256 requestedTerm) public view returns (uint256) {
        if (creditLimitExpiration[account] == 0 || block.timestamp >= creditLimitExpiration[account]) {
            return 0; // Credit limit expired or not set
        }
        
        uint256 daysUntilExpiration = (creditLimitExpiration[account] - block.timestamp) / 1 days;
        
        if (requestedTerm > daysUntilExpiration) {
            return daysUntilExpiration;
        }
        
        return requestedTerm;
    }
    
    /**
     * @notice Helper function to convert uint to string
     */
    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    /**
     * @notice Update verifier contract (owner only)
     */
    function updateVerifier(address _verifier) external onlyOwner {
        verifier = IVerifier(_verifier);
    }
    
    /**
     * @notice Update interest rate (owner only) - DEPRECATED
     */
    function updateInterestRate(uint256 _interestRate) external onlyOwner {
        // This function is deprecated as we now use dynamic rates
        revert("Use dynamic interest rates based on term");
    }
}
