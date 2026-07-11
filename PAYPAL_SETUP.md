# PayPal Integration Setup Guide

## Prerequisites

1. **PayPal Developer Account** (free at https://developer.paypal.com/)
2. **Get Credentials:**
   - Client ID (from Sandbox)
   - Client Secret (from Sandbox)

## Step 1: Set Environment Variables

Add these to your `.cal` file:

```
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
```

**Important:** For production, switch to live credentials from PayPal.

## Step 2: Deploy Supabase Migration

Run this in your Supabase SQL Editor to add the deposits table:

```bash
# Copy the contents of supabase/migrations/add_deposits_table.sql
# and run it in Supabase SQL Editor
```

## Step 3: Deploy Supabase Edge Function

Deploy the verify-deposit function:

```bash
supabase functions deploy verify-deposit \
  --env PAYPAL_CLIENT_ID=your_client_id \
  --env PAYPAL_CLIENT_SECRET=your_client_secret
```

## Step 4: Update Wallet Page

Edit `pages/wallet.html` and make these changes:

### Add PayPal Script in `<head>`

```html
<!-- Add this before closing </head> tag -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=USD"></script>
<script src="../js/paypal-integration.js"></script>
```

### Update the Deposit Modal

Replace the existing deposit method options with:

```html
<!-- Inside the modal after deposit methods -->
<div class="deposit-method" onclick="openPayPalDeposit('paypal-small')">
  <div class="deposit-method-icon">💳</div>
  <div class="deposit-method-info">
    <strong>PayPal - $5.00</strong>
    <span>Get 500 points</span>
  </div>
  <div class="deposit-method-arrow">→</div>
</div>

<div class="deposit-method" onclick="openPayPalDeposit('paypal-medium')">
  <div class="deposit-method-icon">💳</div>
  <div class="deposit-method-info">
    <strong>PayPal - $20.00</strong>
    <span>Get 2000 points</span>
  </div>
  <div class="deposit-method-arrow">→</div>
</div>

<div class="deposit-method" onclick="openPayPalDeposit('paypal-large')">
  <div class="deposit-method-icon">💳</div>
  <div class="deposit-method-info">
    <strong>PayPal - $50.00</strong>
    <span>Get 5000 points</span>
  </div>
  <div class="deposit-method-arrow">→</div>
</div>
```

### Add PayPal Button Container

Add this after the deposit methods:

```html
<div id="paypal-button-container" style="display:none; margin-top: 20px;"></div>
```

### Add JavaScript Handler

Add this script before closing `</body>` tag:

```javascript
<script>
// Initialize PayPal Client ID
PayPalIntegration.clientId = 'YOUR_PAYPAL_CLIENT_ID';

// Deposit amounts mapping
const PAYPAL_AMOUNTS = {
  'paypal-small': 500,    // $5.00 in cents
  'paypal-medium': 2000,  // $20.00 in cents
  'paypal-large': 5000,   // $50.00 in cents
};

async function openPayPalDeposit(depositType) {
  const amountInCents = PAYPAL_AMOUNTS[depositType];
  if (!amountInCents) {
    console.error('Invalid deposit type');
    return;
  }

  // Show PayPal button container
  const container = document.getElementById('paypal-button-container');
  container.style.display = 'block';
  container.innerHTML = ''; // Clear previous buttons

  try {
    await PayPalIntegration.createPayPalButton('paypal-button-container', amountInCents);
  } catch (error) {
    console.error('Error creating PayPal button:', error);
    showErrorMessage('Failed to initialize PayPal. Please try again.');
  }
}

// Replace 'YOUR_PAYPAL_CLIENT_ID' with actual client ID
</script>
```

## Step 5: Update Configuration

In `js/paypal-integration.js`, update:

```javascript
const PAYPAL_CONFIG = {
  clientId: 'YOUR_PAYPAL_CLIENT_ID', // Replace with actual
  verifyDepositUrl: 'YOUR_SUPABASE_URL/functions/v1/verify-deposit', // Or your endpoint
};
```

## Step 6: Update getCurrentUserId() Implementation

In `js/paypal-integration.js`, implement the `getCurrentUserId()` function using your actual auth:

```javascript
async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user.id;
}
```

## Testing

### Sandbox Testing Steps:

1. Open wallet page
2. Click "Deposit" button
3. Select PayPal deposit amount
4. Click PayPal button
5. Use sandbox credentials:
   - **Email:** sb-xxxxx@personal.example.com
   - **Password:** (from PayPal dashboard)
6. Verify payment completes

### Test PayPal Accounts

Create sandbox buyers at: https://developer.paypal.com/dashboard/accounts

## Production Deployment

1. **Switch API endpoints:**
   ```typescript
   const PAYPAL_API = 'https://api.paypal.com'; // Not sandbox
   ```

2. **Update environment variables:**
   ```
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_client_secret
   ```

3. **Update wallet.html script:**
   ```html
   <script src="https://www.paypal.com/sdk/js?client-id=YOUR_LIVE_CLIENT_ID"></script>
   ```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "PayPal SDK not loaded" | Add PayPal script tag to HTML head |
| "clientId is required" | Update `YOUR_PAYPAL_CLIENT_ID` in HTML |
| "Verification failed" | Check Supabase function logs |
| "Payment not captured" | Ensure order was approved before capture |
| "User not found" | Verify user is logged in (check auth) |

## Security Notes

- ✅ All payment verification happens server-side
- ✅ Users cannot credit their own balance directly
- ✅ Deposits are only credited after PayPal confirmation
- ✅ Order IDs are unique and prevent double-processing
- ✅ All transactions are logged in deposits table

## Next Steps

After PayPal is working:
1. Add withdrawal system (redeem points for gift cards)
2. Set up email notifications for deposits
3. Add transaction history page
4. Implement referral system (earn bonus points)
