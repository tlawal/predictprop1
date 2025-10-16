import { ethers } from 'ethers';

// USDC Contract ABI (minimal interface for transfers and approvals)
const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// USDC Contract Addresses
const USDC_ADDRESSES = {
  ethereum: '0xA0b86a33E6441e88C5F2712C3E9b74Ec6F4f5b26', // Mainnet
  polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',    // Polygon
  arbitrum: '0xFF970A61A04b1cA14834A43f5de4533eBDDB5CC8'   // Arbitrum
};

// Platform wallet addresses (replace with actual wallets)
const PLATFORM_WALLETS = {
  ethereum: '0x742d35Cc6735d1F5c8a5a0b5f5c8a5a0b5f5c8a5', // Replace
  polygon: '0x742d35Cc6735d1F5c8a5a0b5f5c8a5a0b5f5c8a5',   // Replace
  arbitrum: '0x742d35Cc6735d1F5c8a5a0b5f5c8a5a0b5f5c8a5'   // Replace
};

class USDCPaymentProcessor {
  constructor(network = 'polygon') {
    this.network = network;
    this.usdcAddress = USDC_ADDRESSES[network];
    this.platformWallet = PLATFORM_WALLETS[network];
    this.provider = null;
    this.signer = null;
    this.usdcContract = null;
  }

  /**
   * Initialize the payment processor with a Web3 provider
   */
  async initialize(provider) {
    try {
      this.provider = new ethers.providers.Web3Provider(provider);
      this.signer = this.provider.getSigner();

      // Verify we're on the correct network
      const network = await this.provider.getNetwork();
      const expectedChainId = this.getChainIdForNetwork(this.network);

      if (network.chainId !== expectedChainId) {
        throw new Error(`Please switch to ${this.network} network`);
      }

      // Initialize USDC contract
      this.usdcContract = new ethers.Contract(
        this.usdcAddress,
        USDC_ABI,
        this.signer
      );

      return { success: true };
    } catch (error) {
      console.error('USDC Payment Processor initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process a USDC payment
   */
  async processPayment(amountUSD, planId, userId) {
    try {
      if (!this.usdcContract) {
        throw new Error('Payment processor not initialized');
      }

      // Get user's wallet address
      const userAddress = await this.signer.getAddress();

      // Get USDC decimals
      const decimals = await this.usdcContract.decimals();

      // Convert USD amount to USDC (assuming 6 decimals for USDC)
      const amountUSDC = ethers.utils.parseUnits(amountUSD.toString(), decimals);

      // Check user balance
      const balance = await this.usdcContract.balanceOf(userAddress);
      if (balance.lt(amountUSDC)) {
        throw new Error('Insufficient USDC balance');
      }

      console.log(`Processing USDC payment: ${amountUSD} USD (${amountUSDC.toString()} USDC) from ${userAddress}`);

      // First approve the platform wallet to spend USDC
      console.log('Approving USDC transfer...');
      const approveTx = await this.usdcContract.approve(this.platformWallet, amountUSDC);
      const approveReceipt = await approveTx.wait();

      console.log('Approval confirmed:', approveReceipt.transactionHash);

      // Then transfer the USDC
      console.log('Transferring USDC...');
      const transferTx = await this.usdcContract.transfer(this.platformWallet, amountUSDC);
      const transferReceipt = await transferTx.wait();

      console.log('Transfer confirmed:', transferReceipt.transactionHash);

      return {
        success: true,
        transactionHash: transferReceipt.transactionHash,
        amount: amountUSD,
        userAddress,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('USDC payment processing failed:', error);
      return {
        success: false,
        error: error.message,
        amount: amountUSD,
        userAddress: await this.signer?.getAddress()
      };
    }
  }

  /**
   * Check USDC balance for an address
   */
  async getUSDCBalance(address) {
    try {
      if (!this.usdcContract) {
        throw new Error('Payment processor not initialized');
      }

      const balance = await this.usdcContract.balanceOf(address);
      const decimals = await this.usdcContract.decimals();

      return {
        balance: ethers.utils.formatUnits(balance, decimals),
        rawBalance: balance.toString()
      };
    } catch (error) {
      console.error('Error checking USDC balance:', error);
      return { error: error.message };
    }
  }

  /**
   * Process a payout (platform to user)
   */
  async processPayout(amountUSD, recipientAddress) {
    try {
      if (!this.usdcContract) {
        throw new Error('Payment processor not initialized');
      }

      // This would require the platform to have a signer with USDC balance
      // In production, this would be handled by a backend service with platform funds
      throw new Error('Payout processing not implemented for frontend use');

    } catch (error) {
      console.error('USDC payout processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get the expected chain ID for a network
   */
  getChainIdForNetwork(network) {
    const chainIds = {
      ethereum: 1,
      polygon: 137,
      arbitrum: 42161
    };
    return chainIds[network] || 137; // Default to Polygon
  }

  /**
   * Check if user is on the correct network
   */
  async checkNetwork() {
    try {
      if (!this.provider) return { isCorrect: false, error: 'No provider' };

      const network = await this.provider.getNetwork();
      const expectedChainId = this.getChainIdForNetwork(this.network);

      return {
        isCorrect: network.chainId === expectedChainId,
        currentChainId: network.chainId,
        expectedChainId,
        networkName: this.network
      };
    } catch (error) {
      return { isCorrect: false, error: error.message };
    }
  }

  /**
   * Switch to the correct network
   */
  async switchNetwork() {
    try {
      if (!this.provider) throw new Error('No provider');

      const expectedChainId = this.getChainIdForNetwork(this.network);

      await this.provider.send('wallet_switchEthereumChain', [{
        chainId: `0x${expectedChainId.toString(16)}`
      }]);

      return { success: true };
    } catch (error) {
      console.error('Network switch failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default USDCPaymentProcessor;
