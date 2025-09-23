import { ethers } from "hardhat";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function main() {
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Configuration - Update these addresses for mainnet deployment
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // Polygon USDC
  const PLATFORM_MULTISIG = process.env.PLATFORM_MULTISIG || deployer.address; // Use deployer as default
  const PROFIT_ORACLE = process.env.PROFIT_ORACLE || deployer.address; // Use deployer as default oracle

  console.log("Configuration:");
  console.log("- USDC Address:", USDC_ADDRESS);
  console.log("- Platform Multisig:", PLATFORM_MULTISIG);
  console.log("- Profit Oracle:", PROFIT_ORACLE);

  // Deploy PolyPropVault
  console.log("\nDeploying PolyPropVault...");

  const PolyPropVault = await ethers.getContractFactory("PolyPropVault");
  const vault = await PolyPropVault.deploy(
    USDC_ADDRESS,
    PLATFORM_MULTISIG,
    PROFIT_ORACLE
  );

  await vault.deployed();

  console.log("✅ PolyPropVault deployed to:", vault.address);

  // Verify deployment
  console.log("\nVerifying deployment...");
  const vaultContract = await ethers.getContractAt("PolyPropVault", vault.address);

  const usdcAddress = await vaultContract.USDC();
  const platformMultisig = await vaultContract.PLATFORM_MULTISIG();
  const oracle = await vaultContract.profitOracle();

  console.log("Verification:");
  console.log("- USDC Address:", usdcAddress);
  console.log("- Platform Multisig:", platformMultisig);
  console.log("- Profit Oracle:", oracle);

  // Check initial state
  const paused = await vaultContract.paused();
  const totalAssets = await vaultContract.totalAssets();
  const totalSupply = await vaultContract.totalSupply();

  console.log("Initial State:");
  console.log("- Paused:", paused);
  console.log("- Total Assets:", totalAssets.toString());
  console.log("- Total Supply:", totalSupply.toString());

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    vault: {
      address: vault.address,
      usdc: usdcAddress,
      platformMultisig: platformMultisig,
      oracle: oracle,
      deployer: deployer.address,
      timestamp: new Date().toISOString()
    }
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Optional: Save to file
  const filename = `deployment-${network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to ${filename}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Fund the vault with initial USDC if needed");
  console.log("2. Set up the profit oracle contract");
  console.log("3. Configure the frontend to interact with the vault");
  console.log("4. Test deposits and withdrawals on testnet first");
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
