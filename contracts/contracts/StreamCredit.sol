// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @notice Groth16 verifier generated from the `creditCheck` circuit.
 * @dev The public signal layout is fixed by the circuit: circom emits outputs
 *      first, then the public inputs in declaration order.
 *        pubSignals[0] = isValid          (circuit output, 1 = passed)
 *        pubSignals[1] = revenueThreshold (public input, USDC 6 decimals)
 *        pubSignals[2] = benfordThreshold (public input, fraud tolerance)
 */
interface IVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[3] memory pubSignals
    ) external view returns (bool);
}

/**
 * @title StreamCredit
 * @notice Lending protocol dựa trên dòng tiền thời gian thực với ZK fraud detection
 * @dev Credit limit chỉ được cấp từ một ZK proof hợp lệ. Con số doanh thu dùng để
 *      tính hạn mức là `revenueThreshold` — một public signal đã bound vào proof —
 *      chứ không phải giá trị người vay tự khai.
 */
contract StreamCredit is Ownable, ReentrancyGuard {
    IVerifier public verifier;
    IERC20 public usdcToken;

    // Credit limit cho mỗi borrower
    mapping(address => uint256) public creditLimit;

    // Thời hạn cuối của credit limit (1 năm từ khi verify ZK proof)
    mapping(address => uint256) public creditLimitExpiration;

    // Số tiền gốc đang vay
    mapping(address => uint256) public borrowed;

    // Mốc thời gian bắt đầu tính lãi cho phần gốc hiện tại
    mapping(address => uint256) public borrowTimestamp;

    // Kỳ hạn vay (số ngày)
    mapping(address => uint256) public borrowTerm;

    // Lãi đã phát sinh nhưng chưa trả, chốt tại lần thanh toán gần nhất
    mapping(address => uint256) public accruedInterest;

    // Commitment fee đã trả lần cuối
    mapping(address => uint256) public lastCommitmentFeePayment;

    // Last full repayment timestamp (để enforce cooldown period)
    mapping(address => uint256) public lastFullRepayment;

    // Các proof đã được sử dụng, chống replay
    mapping(bytes32 => bool) public usedProofs;

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

    uint256 public constant MIN_TERM_DAYS = 7;
    uint256 public constant MAX_TERM_DAYS = 365;

    /**
     * @notice Trần của `benfordThreshold` được chấp nhận trên chain.
     * @dev Circuit chỉ chứng minh `benfordScore < benfordThreshold`. Nếu không chặn
     *      trần, người vay tự chọn threshold đủ lớn là bài kiểm tra gian lận vô nghĩa.
     */
    uint256 public maxBenfordThreshold = 20;

    /// @notice Doanh thu tối thiểu (USDC, 6 decimals) để được cấp hạn mức.
    uint256 public minProvenRevenue = 1_000 * 1e6;

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
    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    event RiskParametersUpdated(uint256 maxBenfordThreshold, uint256 minProvenRevenue);

    constructor(address _verifier, address _usdcToken) Ownable(msg.sender) {
        require(_verifier != address(0), "Verifier is zero address");
        require(_usdcToken != address(0), "USDC is zero address");

        verifier = IVerifier(_verifier);
        usdcToken = IERC20(_usdcToken);
    }

    /**
     * @notice Verify ZK proof và cấp credit limit
     * @dev Hạn mức được suy ra từ `pubSignals[1]` (revenueThreshold) — giá trị này nằm
     *      trong proof nên người vay không thể khai khống. Muốn hạn mức cao hơn thì
     *      phải tạo proof mới với threshold cao hơn, và proof đó chỉ hợp lệ nếu doanh
     *      thu thật sự vượt ngưỡng.
     * @param a, b, c: Groth16 proof components
     * @param pubSignals: [isValid, revenueThreshold, benfordThreshold]
     */
    function verifyAndUpdateCredit(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[3] calldata pubSignals
    ) external {
        uint256 isValid = pubSignals[0];
        uint256 provenRevenue = pubSignals[1];
        uint256 benfordThreshold = pubSignals[2];

        require(isValid == 1, "Proof validation failed");
        require(benfordThreshold <= maxBenfordThreshold, "Benford threshold too permissive");
        require(provenRevenue >= minProvenRevenue, "Revenue below minimum");

        // Một proof chỉ dùng được một lần, kể cả bởi ví khác.
        bytes32 proofId = keccak256(abi.encode(a, b, c, pubSignals));
        require(!usedProofs[proofId], "Proof already used");

        require(verifier.verifyProof(a, b, c, pubSignals), "Invalid ZK proof");

        usedProofs[proofId] = true;

        uint256 newCreditLimit = (provenRevenue * CREDIT_RATIO) / 100;

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
     * @notice Tổng lãi đang nợ: phần đã chốt cộng phần phát sinh từ mốc gần nhất
     * @param account: Địa chỉ người vay
     * @return Số tiền lãi
     */
    function calculateInterest(address account) public view returns (uint256) {
        uint256 settled = accruedInterest[account];

        if (borrowed[account] == 0) return settled;

        uint256 timeElapsed = block.timestamp - borrowTimestamp[account];
        uint256 rate = getInterestRate(borrowTerm[account]);

        uint256 annualInterest = (borrowed[account] * rate) / BASIS_POINTS;
        uint256 newInterest = (annualInterest * timeElapsed) / SECONDS_PER_YEAR;

        return settled + newInterest;
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
        require(termDays >= MIN_TERM_DAYS && termDays <= MAX_TERM_DAYS, "Invalid term");
        require(borrowed[msg.sender] == 0, "Already have active loan");
        require(creditLimit[msg.sender] > 0, "No credit limit");

        // Cooldown: phải duy trì dư nợ = 0 trong 5 ngày sau khi tất toán
        if (lastFullRepayment[msg.sender] > 0) {
            require(
                block.timestamp >= lastFullRepayment[msg.sender] + COOLDOWN_PERIOD,
                "Must wait 5 days after full repayment before borrowing again"
            );
        }

        require(
            block.timestamp < creditLimitExpiration[msg.sender],
            "Credit limit expired. Please submit new ZK proof to renew."
        );

        // Kỳ hạn không được vượt quá thời điểm hạn mức hết hiệu lực
        uint256 daysUntilExpiration = (creditLimitExpiration[msg.sender] - block.timestamp) / 1 days;
        uint256 actualTerm = termDays > daysUntilExpiration ? daysUntilExpiration : termDays;

        require(actualTerm >= MIN_TERM_DAYS, "Insufficient time remaining on credit limit (min 7 days required)");

        require(amount <= creditLimit[msg.sender], "Exceeds credit limit");
        require(amount <= totalLiquidity, "Insufficient liquidity");

        borrowed[msg.sender] = amount;
        borrowTimestamp[msg.sender] = block.timestamp;
        borrowTerm[msg.sender] = actualTerm;
        accruedInterest[msg.sender] = 0;
        totalLiquidity -= amount;

        uint256 rate = getInterestRate(actualTerm);

        require(usdcToken.transfer(msg.sender, amount), "Transfer failed");

        emit Borrowed(msg.sender, amount, actualTerm, rate);
    }

    /**
     * @notice Trả nợ một phần hoặc toàn bộ
     * @param amount: Số tiền trả; truyền 0 để tất toán toàn bộ dư nợ
     */
    function repay(uint256 amount) external nonReentrant {
        _repay(amount);
    }

    /**
     * @notice Tất toán toàn bộ khoản vay
     */
    function repayFull() external nonReentrant {
        _repay(0);
    }

    /**
     * @dev Thanh toán theo thứ tự lãi trước, gốc sau. Mỗi lần thanh toán đều chốt lại
     *      lãi phát sinh và dời `borrowTimestamp` về hiện tại, nên phần lãi đã trả
     *      không bị tính lại ở lần sau.
     */
    function _repay(uint256 amount) internal {
        require(borrowed[msg.sender] > 0, "No active loan");

        uint256 principal = borrowed[msg.sender];
        uint256 interest = calculateInterest(msg.sender);
        bool isEarly = isEarlyRepayment(msg.sender);

        if (isEarly) {
            interest = (interest * (BASIS_POINTS - EARLY_REPAY_BONUS)) / BASIS_POINTS;
        }

        uint256 totalDebt = principal + interest;
        uint256 repayAmount = (amount == 0) ? totalDebt : amount;

        require(repayAmount <= totalDebt, "Amount exceeds total debt");
        require(usdcToken.balanceOf(msg.sender) >= repayAmount, "Insufficient USDC balance");
        require(usdcToken.allowance(msg.sender, address(this)) >= repayAmount, "Insufficient USDC allowance");

        require(usdcToken.transferFrom(msg.sender, address(this), repayAmount), "Transfer failed");

        uint256 interestPaid;
        uint256 principalPaid;

        if (repayAmount == totalDebt) {
            interestPaid = interest;
            principalPaid = principal;

            borrowed[msg.sender] = 0;
            borrowTimestamp[msg.sender] = 0;
            borrowTerm[msg.sender] = 0;
            accruedInterest[msg.sender] = 0;
            lastFullRepayment[msg.sender] = block.timestamp;
        } else if (repayAmount <= interest) {
            // Chỉ đủ trả một phần lãi; gốc giữ nguyên, lãi còn lại được chốt lại.
            interestPaid = repayAmount;
            accruedInterest[msg.sender] = interest - repayAmount;
            borrowTimestamp[msg.sender] = block.timestamp;
        } else {
            // Trả hết lãi rồi mới trừ vào gốc.
            interestPaid = interest;
            principalPaid = repayAmount - interest;

            borrowed[msg.sender] -= principalPaid;
            accruedInterest[msg.sender] = 0;
            borrowTimestamp[msg.sender] = block.timestamp;
        }

        totalLiquidity += repayAmount;

        emit Repaid(msg.sender, principalPaid, interestPaid, isEarly);
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

        require(usdcToken.transferFrom(msg.sender, address(this), fee), "Transfer failed");

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

        if (_creditLimitExpiration > block.timestamp) {
            _daysUntilExpiration = (_creditLimitExpiration - block.timestamp) / 1 days;
        } else {
            _daysUntilExpiration = 0;
        }

        _canBorrow = (_borrowed == 0) &&
                     (_creditLimit > 0) &&
                     (_creditLimitExpiration > block.timestamp) &&
                     (_lastFullRepayment == 0 || block.timestamp >= _lastFullRepayment + COOLDOWN_PERIOD);
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
     * @notice Update verifier contract (owner only)
     */
    function updateVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Verifier is zero address");

        address oldVerifier = address(verifier);
        verifier = IVerifier(_verifier);

        emit VerifierUpdated(oldVerifier, _verifier);
    }

    /**
     * @notice Cập nhật tham số rủi ro cho khâu chấm tín dụng (owner only)
     * @param _maxBenfordThreshold: Trần tolerance của bài kiểm tra Benford
     * @param _minProvenRevenue: Doanh thu tối thiểu để được cấp hạn mức
     */
    function updateRiskParameters(uint256 _maxBenfordThreshold, uint256 _minProvenRevenue)
        external
        onlyOwner
    {
        require(_maxBenfordThreshold > 0, "Benford threshold must be > 0");

        maxBenfordThreshold = _maxBenfordThreshold;
        minProvenRevenue = _minProvenRevenue;

        emit RiskParametersUpdated(_maxBenfordThreshold, _minProvenRevenue);
    }
}
