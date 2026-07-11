# Crypto Payments Setup Guide

Your gambling platform now supports **Bitcoin**, **Ethereum**, and **USDC** deposits!

## Overview

Crypto deposits work by:
1. User sees your wallet address in the deposit modal
2. User sends crypto to that address
3. You verify the payment on the blockchain
4. You manually credit their account (or automate with webhooks)

## Quick Setup (5 minutes)

### Step 1: Get Crypto Wallet Addresses

You need **one address per coin type**:

**Option A: Use a Custodial Service (Easiest)**
- **Coinbase Commerce** (https://commerce.coinbase.com/)
  - Free merchant account
  - Handles crypto → USD conversion
  - Webhooks notify you of payments
  - Supports BTC, ETH, USDC, DAI
- **Kraken** (https://www.kraken.com/)
  - Business account
  - Generate deposit addresses
- **BitPay** (https://bitpay.com/)
  - Invoice-based payments
  - Auto-converts to USD

**Option B: Self-Custody (Advanced)**
- Use a hardware wallet (Ledger, Trezor)
- Or software wallet (MetaMask for Ethereum, Blue Wallet for Bitcoin)
- Manage private keys yourself
- ⚠️ More secure but requires technical knowledge

### Step 2: Add Addresses to Your App

Edit `pages/wallet.html` and find the crypto deposit section:

```javascript
const cryptoInfo = {
  bitcoin: {
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', // REPLACE THIS
    // ...
  },
  ethereum: {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1d0d5', // REPLACE THIS
    // ...
  },
  usdc: {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1d0d5', // REPLACE THIS (same as ETH)
    // ...
  }
};
```

Replace with your actual addresses.

## How to Verify Crypto Payments

### Manual Verification (Simple)

1. **Bitcoin Block Explorer:** https://blockchair.com/bitcoin
   - Search for your wallet address
   - See all incoming transactions
   - Verify the amount matches

2. **Ethereum Block Explorer:** https://etherscan.io/
   - Search for your wallet address
   - See all incoming transactions
   - Verify amount matches

3. **When you see a payment:**
   - Find the user in Supabase
   - Run this SQL query to credit their account:
   ```sql
   SELECT credit_balance(
     'user-id-here',
     5000  -- amount in cents ($50)
   );
   ```

### Automated Verification (Advanced)

Use **Coinbase Commerce webhooks** to automatically credit accounts:

1. **Set up webhook in Coinbase Commerce:**
   - Go to Settings → Webhooks
   - Add endpoint: `https://yourapp.com/functions/v1/verify-crypto`
   - Subscribe to `charge:confirmed` events

2. **Deploy crypto verification function:**
   ```bash
   supabase functions deploy verify-crypto
   ```

3. **Coinbase will POST to your function when payment arrives:**
   ```json
   {
     "id": "charge-id",
     "data": {
       "amount": "0.0001",
       "currency": "BTC",
       "metadata": {
         "user_id": "abc123"
       }
     }
   }
   ```

## Setting User-Specific Amounts

Currently, users see fixed amounts ($5, $20, $50). For custom amounts:

1. Add an input field to the crypto deposit modal:
   ```html
   <input type="number" id="customAmount" placeholder="Enter amount in USD" min="1" max="1000">
   ```

2. Calculate crypto equivalent:
   ```javascript
   const usdAmount = parseFloat(document.getElementById('customAmount').value);
   const btcAmount = (usdAmount / 45000).toFixed(8); // Current BTC price
   ```

## Blockchain Details

### Bitcoin
- **Network:** Bitcoin Network
- **Address Format:** Starts with `bc1` (SegWit) or `1` (Legacy) or `3` (P2SH)
- **Confirmations:** 1-2 confirmations = ~10 minutes
- **Fee:** User pays network fee (usually $1-5)
- **Chain:** Only one (no alternatives)

### Ethereum
- **Network:** Ethereum Mainnet (not testnet!)
- **Address Format:** Starts with `0x`, 42 characters
- **Confirmations:** 12 confirmations = ~3 minutes
- **Fee:** User pays gas fee (usually $5-50 depending on network load)
- **Token Address for USDC:** `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`

### USDC
- **Network:** Ethereum (ERC-20 token)
- **Address:** Send to your Ethereum address
- **Conversion Rate:** 1 USDC = $1.00 USD (always)
- **Less volatile** than BTC or ETH

## Cost Comparison

| Method | Setup | Per Transaction | Notes |
|--------|-------|-----------------|-------|
| **Manual verification** | Free | $0 | You verify manually, slow |
| **Coinbase Commerce** | Free | 1% | Auto-verifies, instant |
| **BitPay** | Free | 0.5-1% | Good for invoices |
| **Stripe Crypto** | Free | ~3-4% | Converts to USD immediately |
| **Self-custody** | Free | $0 | Tech heavy, manage keys yourself |

## Testing with Testnet (Sandbox)

Before going live, test on **testnet** (fake money):

### Bitcoin Testnet
```
Address: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
Get test BTC: https://testnet-faucet.mempool.space/
Explore: https://blockchair.com/bitcoin/testnet
```

### Ethereum Sepolia Testnet
```
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f1d0d5
Get test ETH: https://sepoliafaucet.com/
Explore: https://sepolia.etherscan.io/
```

## Security Best Practices

✅ **DO:**
- Use separate addresses per coin type
- Verify address format before sharing
- Use hardware wallet for large amounts
- Keep private keys secure
- Document all addresses in your code

❌ **DON'T:**
- Share private keys with anyone
- Use testnet addresses on mainnet
- Send to wrong address (funds lost forever)
- Accept payments from unverified addresses
- Expose raw transaction data to users

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Payment not showing up" | Wait 2-3 blocks (10-30 min for BTC, 3-5 min for ETH) |
| "Wrong address format" | Bitcoin: starts with `bc1` or `1` or `3`. Ethereum: starts with `0x` |
| "User sent wrong coin" | Check blockchain, it's lost. Contact user to try again from correct address |
| "USDC won't appear on wallet" | Make sure you're importing the USDC token contract address |
| "Ethereum fee was too high" | That's the network fee. User pays it, not your platform |

## Next Steps

1. **Choose your wallet service** (Coinbase Commerce recommended)
2. **Get your addresses** and update `wallet.html`
3. **Test with testnet** before going live
4. **For production:** Set up webhook verification (auto-credit)
5. **Monitor payments** on block explorers daily

## Useful Links

- **Bitcoin Block Explorer:** https://blockchair.com/bitcoin
- **Ethereum Block Explorer:** https://etherscan.io/
- **Coinbase Commerce:** https://commerce.coinbase.com/
- **Bitcoin Documentation:** https://bitcoin.org/en/developer-documentation
- **Ethereum Documentation:** https://ethereum.org/en/developers/

---

**Questions?**

Crypto is decentralized and immutable — payments sent to your address are final. Always test on testnet first!
