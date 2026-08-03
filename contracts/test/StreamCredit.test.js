const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const USDC = (n) => ethers.parseUnits(String(n), 6);

const DAY = 24 * 60 * 60;
const YEAR = 365 * DAY;
const BASIS_POINTS = 10_000n;
const SHORT_TERM_RATE = 500n; // 5% APR, terms up to 30 days

describe("StreamCredit", function () {
  let streamCredit;
  let usdc;
  let verifier;
  let owner;
  let borrower;
  let lender;

  // `revenueThreshold` is a public signal of the circuit, denominated in USDC
  // units. The credit limit is CREDIT_RATIO (30%) of it.
  const REVENUE = USDC(50_000);
  const CREDIT_LIMIT = (REVENUE * 30n) / 100n; // 15,000 USDC
  const BENFORD_THRESHOLD = 10n; // must stay <= maxBenfordThreshold (20)

  // Each proof may only be redeemed once, so tests that need several proofs
  // vary this counter to produce distinct `a` components.
  let proofNonce = 0;

  function makeProof({
    isValid = 1n,
    revenue = REVENUE,
    benfordThreshold = BENFORD_THRESHOLD,
  } = {}) {
    proofNonce += 1;
    return {
      a: [BigInt(proofNonce), 2n],
      b: [
        [1n, 2n],
        [3n, 4n],
      ],
      c: [1n, 2n],
      pubSignals: [isValid, revenue, benfordThreshold],
    };
  }

  async function submitProof(account, overrides) {
    const p = makeProof(overrides);
    return streamCredit
      .connect(account)
      .verifyAndUpdateCredit(p.a, p.b, p.c, p.pubSignals);
  }

  beforeEach(async function () {
    [owner, borrower, lender] = await ethers.getSigners();
    proofNonce = 0;

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const MockVerifier = await ethers.getContractFactory("MockVerifier");
    verifier = await MockVerifier.deploy();

    const StreamCredit = await ethers.getContractFactory("StreamCredit");
    streamCredit = await StreamCredit.deploy(
      await verifier.getAddress(),
      await usdc.getAddress()
    );

    const liquidityAmount = USDC(100_000);
    await usdc.approve(await streamCredit.getAddress(), liquidityAmount);
    await streamCredit.addLiquidity(liquidityAmount);

    // Borrowers need USDC on hand to pay interest back.
    await usdc.transfer(borrower.address, USDC(10_000));
  });

  describe("Credit Verification", function () {
    it("Should derive the credit limit from the proven revenue signal", async function () {
      await submitProof(borrower);

      expect(await streamCredit.creditLimit(borrower.address)).to.equal(
        CREDIT_LIMIT
      );
      expect(
        await streamCredit.creditLimitExpiration(borrower.address)
      ).to.be.gt(await time.latest());
    });

    it("Should reject a proof the verifier does not accept", async function () {
      await verifier.setShouldVerify(false);

      await expect(submitProof(borrower)).to.be.revertedWith(
        "Invalid ZK proof"
      );
    });

    it("Should reject a proof whose isValid signal is not 1", async function () {
      await expect(
        submitProof(borrower, { isValid: 0n })
      ).to.be.revertedWith("Proof validation failed");
    });

    it("Should reject a benford threshold above the on-chain cap", async function () {
      // Without this cap a borrower picks a tolerance so loose that the
      // fraud check inside the circuit always passes.
      await expect(
        submitProof(borrower, { benfordThreshold: 1_000n })
      ).to.be.revertedWith("Benford threshold too permissive");
    });

    it("Should reject revenue below the configured minimum", async function () {
      await expect(
        submitProof(borrower, { revenue: USDC(10) })
      ).to.be.revertedWith("Revenue below minimum");
    });

    it("Should reject replaying a proof, including from another wallet", async function () {
      const p = makeProof();

      await streamCredit
        .connect(borrower)
        .verifyAndUpdateCredit(p.a, p.b, p.c, p.pubSignals);

      await expect(
        streamCredit
          .connect(lender)
          .verifyAndUpdateCredit(p.a, p.b, p.c, p.pubSignals)
      ).to.be.revertedWith("Proof already used");

      expect(await streamCredit.creditLimit(lender.address)).to.equal(0);
    });

    it("Should let the owner retune the risk parameters", async function () {
      await streamCredit.updateRiskParameters(50, USDC(100));

      await submitProof(borrower, {
        revenue: USDC(200),
        benfordThreshold: 45n,
      });

      expect(await streamCredit.creditLimit(borrower.address)).to.equal(
        USDC(60)
      );
    });

    it("Should reject risk parameter updates from a non-owner", async function () {
      await expect(
        streamCredit.connect(borrower).updateRiskParameters(50, USDC(100))
      ).to.be.revertedWithCustomError(
        streamCredit,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Borrowing", function () {
    beforeEach(async function () {
      await submitProof(borrower);
    });

    it("Should allow borrowing within credit limit", async function () {
      const borrowAmount = USDC(5_000);

      await streamCredit.connect(borrower).borrow(borrowAmount, 30);

      expect(await streamCredit.borrowed(borrower.address)).to.equal(
        borrowAmount
      );
      expect(await streamCredit.borrowTerm(borrower.address)).to.equal(30);
    });

    it("Should reject borrowing without a verified credit limit", async function () {
      // `lender` never submitted a proof; the contract must not self-provision.
      await expect(
        streamCredit.connect(lender).borrow(USDC(1_000), 30)
      ).to.be.revertedWith("No credit limit");
    });

    it("Should reject borrowing exceeding credit limit", async function () {
      await expect(
        streamCredit.connect(borrower).borrow(USDC(20_000), 30)
      ).to.be.revertedWith("Exceeds credit limit");
    });

    it("Should reject borrowing beyond available liquidity", async function () {
      // Credit limit allows it, but the pool cannot fund it and the contract
      // no longer mints USDC for itself.
      await streamCredit.connect(owner).removeLiquidity(USDC(96_000));

      await expect(
        streamCredit.connect(borrower).borrow(USDC(5_000), 30)
      ).to.be.revertedWith("Insufficient liquidity");
    });

    it("Should reject a term outside the 7-365 day range", async function () {
      await expect(
        streamCredit.connect(borrower).borrow(USDC(1_000), 6)
      ).to.be.revertedWith("Invalid term");

      await expect(
        streamCredit.connect(borrower).borrow(USDC(1_000), 366)
      ).to.be.revertedWith("Invalid term");
    });

    it("Should reject a second loan while one is active", async function () {
      await streamCredit.connect(borrower).borrow(USDC(1_000), 30);

      await expect(
        streamCredit.connect(borrower).borrow(USDC(1_000), 30)
      ).to.be.revertedWith("Already have active loan");
    });

    it("Should price each term band off the reverse interest curve", async function () {
      expect(await streamCredit.getInterestRate(30)).to.equal(500);
      expect(await streamCredit.getInterestRate(90)).to.equal(800);
      expect(await streamCredit.getInterestRate(180)).to.equal(1500);
      expect(await streamCredit.getInterestRate(365)).to.equal(2500);
    });
  });

  describe("Interest accrual", function () {
    const borrowAmount = USDC(5_000);

    beforeEach(async function () {
      await submitProof(borrower);
      await streamCredit.connect(borrower).borrow(borrowAmount, 30);
    });

    it("Should accrue interest linearly on the outstanding principal", async function () {
      await time.increase(10 * DAY);

      const expected =
        (((borrowAmount * SHORT_TERM_RATE) / BASIS_POINTS) * BigInt(10 * DAY)) /
        BigInt(YEAR);

      expect(await streamCredit.calculateInterest(borrower.address)).to.be.closeTo(
        expected,
        USDC("0.01")
      );
    });

    // Regression: a partial repayment used to leave `borrowTimestamp` untouched,
    // so interest already settled was charged again on the next repayment.
    it("Should not re-charge interest that a partial repayment already settled", async function () {
      await time.increase(10 * DAY);

      const principalRepaid = USDC(1_000);
      const owedInterest = await streamCredit.calculateInterest(borrower.address);
      const payment = owedInterest + principalRepaid;

      await usdc
        .connect(borrower)
        .approve(await streamCredit.getAddress(), payment);
      await streamCredit.connect(borrower).repay(payment);

      // Interest is fully settled; only principal remains.
      expect(await streamCredit.accruedInterest(borrower.address)).to.equal(0);
      expect(await streamCredit.calculateInterest(borrower.address)).to.be.closeTo(
        0n,
        USDC("0.01")
      );

      const remaining = await streamCredit.borrowed(borrower.address);
      expect(remaining).to.be.closeTo(borrowAmount - principalRepaid, USDC(1));

      // The next period accrues on the reduced principal, from the new mark.
      await time.increase(10 * DAY);

      const expected =
        (((remaining * SHORT_TERM_RATE) / BASIS_POINTS) * BigInt(10 * DAY)) /
        BigInt(YEAR);

      expect(await streamCredit.calculateInterest(borrower.address)).to.be.closeTo(
        expected,
        USDC("0.01")
      );
    });

    it("Should carry unpaid interest forward when a payment cannot cover it", async function () {
      await time.increase(10 * DAY);

      const owedInterest = await streamCredit.calculateInterest(borrower.address);
      const payment = owedInterest / 2n;

      await usdc
        .connect(borrower)
        .approve(await streamCredit.getAddress(), payment);
      await streamCredit.connect(borrower).repay(payment);

      // Principal untouched, the unpaid half is carried as settled interest.
      expect(await streamCredit.borrowed(borrower.address)).to.equal(borrowAmount);
      expect(await streamCredit.accruedInterest(borrower.address)).to.be.gt(0);
      expect(await streamCredit.accruedInterest(borrower.address)).to.be.lt(
        owedInterest
      );
    });
  });

  describe("Repayment", function () {
    const borrowAmount = USDC(5_000);

    beforeEach(async function () {
      await submitProof(borrower);
      await streamCredit.connect(borrower).borrow(borrowAmount, 30);
    });

    async function repayEverything() {
      const owed =
        borrowAmount +
        (await streamCredit.calculateInterest(borrower.address)) +
        USDC(1);

      await usdc.connect(borrower).approve(await streamCredit.getAddress(), owed);
      await streamCredit.connect(borrower).repayFull();
    }

    it("Should clear the loan on repayFull and start the cooldown", async function () {
      await time.increase(10 * DAY);
      await repayEverything();

      expect(await streamCredit.borrowed(borrower.address)).to.equal(0);
      expect(await streamCredit.accruedInterest(borrower.address)).to.equal(0);
      expect(await streamCredit.lastFullRepayment(borrower.address)).to.be.gt(0);
    });

    it("Should reject repaying more than the total debt", async function () {
      const tooMuch = borrowAmount * 2n;

      await usdc
        .connect(borrower)
        .approve(await streamCredit.getAddress(), tooMuch);

      await expect(
        streamCredit.connect(borrower).repay(tooMuch)
      ).to.be.revertedWith("Amount exceeds total debt");
    });

    it("Should enforce the 5-day cooldown after a full repayment", async function () {
      await repayEverything();

      await expect(
        streamCredit.connect(borrower).borrow(USDC(1_000), 30)
      ).to.be.revertedWith(
        "Must wait 5 days after full repayment before borrowing again"
      );
    });

    it("Should allow borrowing again once the cooldown elapses", async function () {
      await repayEverything();
      await time.increase(5 * DAY + 1);

      await streamCredit.connect(borrower).borrow(USDC(1_000), 30);

      expect(await streamCredit.borrowed(borrower.address)).to.equal(USDC(1_000));
    });
  });

  describe("Liquidity Management", function () {
    const amount = USDC(10_000);

    beforeEach(async function () {
      await usdc.mint(lender.address, amount);
      await usdc.connect(lender).approve(await streamCredit.getAddress(), amount);
    });

    it("Should allow adding liquidity", async function () {
      await streamCredit.connect(lender).addLiquidity(amount);

      expect(await streamCredit.liquidityProvided(lender.address)).to.equal(
        amount
      );
    });

    it("Should allow removing liquidity", async function () {
      await streamCredit.connect(lender).addLiquidity(amount);
      await streamCredit.connect(lender).removeLiquidity(amount);

      expect(await streamCredit.liquidityProvided(lender.address)).to.equal(0);
    });

    it("Should reject removing more than the provider deposited", async function () {
      await streamCredit.connect(lender).addLiquidity(amount);

      await expect(
        streamCredit.connect(lender).removeLiquidity(amount + 1n)
      ).to.be.revertedWith("Insufficient balance");
    });
  });
});
