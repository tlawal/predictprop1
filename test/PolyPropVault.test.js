const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PolyPropVault", function () {
  let vault, usdc, oracle, owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.deployed();

    // Deploy mock oracle
    const SimpleProfitOracle = await ethers.getContractFactory("SimpleProfitOracle");
    oracle = await SimpleProfitOracle.deploy();
    await oracle.deployed();

    // Deploy vault
    const PolyPropVault = await ethers.getContractFactory("PolyPropVault");
    vault = await PolyPropVault.deploy(usdc.address, owner.address, oracle.address);
    await vault.deployed();

    // Mint some USDC to users
    await usdc.mint(user1.address, ethers.utils.parseUnits("1000", 6));
    await usdc.mint(user2.address, ethers.utils.parseUnits("1000", 6));
  });

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      expect(await vault.USDC()).to.equal(usdc.address);
    });

    it("Should set the correct platform multisig", async function () {
      expect(await vault.PLATFORM_MULTISIG()).to.equal(owner.address);
    });

    it("Should set the correct oracle", async function () {
      expect(await vault.profitOracle()).to.equal(oracle.address);
    });
  });

  describe("Deposits", function () {
    it("Should allow deposits and mint shares", async function () {
      const depositAmount = ethers.utils.parseUnits("100", 6);

      // Approve vault to spend USDC
      await usdc.connect(user1).approve(vault.address, depositAmount);

      // Deposit
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Check balances
      expect(await vault.balanceOf(user1.address)).to.be.gt(0);
      expect(await usdc.balanceOf(vault.address)).to.equal(depositAmount);
    });

    it("Should calculate shares correctly", async function () {
      const depositAmount = ethers.utils.parseUnits("100", 6);

      await usdc.connect(user1).approve(vault.address, depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const shares = await vault.balanceOf(user1.address);
      const assets = await vault.previewRedeem(shares);

      expect(assets).to.be.closeTo(depositAmount, ethers.utils.parseUnits("1", 6)); // Allow 1 USDC tolerance
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      const depositAmount = ethers.utils.parseUnits("100", 6);
      await usdc.connect(user1).approve(vault.address, depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);
    });

    it("Should allow withdrawals", async function () {
      const shares = await vault.balanceOf(user1.address);
      const initialBalance = await usdc.balanceOf(user1.address);

      await vault.connect(user1).redeem(shares, user1.address, user1.address);

      const finalBalance = await usdc.balanceOf(user1.address);
      expect(finalBalance.sub(initialBalance)).to.be.gt(0);
      expect(await vault.balanceOf(user1.address)).to.equal(0);
    });
  });

  describe("Profit Allocation", function () {
    it("Should allocate profits correctly", async function () {
      const totalProfits = ethers.utils.parseUnits("100", 6);

      // Send USDC to oracle for allocation
      await usdc.mint(oracle.address, totalProfits);

      await vault.allocateProfits(totalProfits);

      // Check that yield was accrued
      expect(await vault.totalYieldAccrued()).to.be.gt(0);
    });

    it("Should allow trader profit claims", async function () {
      const totalProfits = ethers.utils.parseUnits("100", 6);
      await usdc.mint(oracle.address, totalProfits);

      await vault.allocateProfits(totalProfits);

      // Mock trader address from oracle
      const mockTrader = "0x742d35Cc6597C05343Db7c5c00c6b8c6b8c6b8c6";

      const claimable = await vault.getTraderClaimable(mockTrader);
      expect(claimable).to.be.gt(0);

      // Claim profits (would need to be called by trader)
      // await vault.connect(mockTrader).claimTraderProfits(claimable);
    });
  });

  describe("APY Calculation", function () {
    it("Should calculate APY correctly", async function () {
      // Initially should be 0
      expect(await vault.getEstimatedAPY()).to.equal(0);

      // After some yield accrual
      const depositAmount = ethers.utils.parseUnits("1000", 6);
      await usdc.connect(user1).approve(vault.address, depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Simulate yield accrual
      const totalProfits = ethers.utils.parseUnits("100", 6);
      await usdc.mint(oracle.address, totalProfits);
      await vault.allocateProfits(totalProfits);

      const apy = await vault.getEstimatedAPY();
      expect(apy).to.be.gt(0);
    });
  });
});
