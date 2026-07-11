# PayPal Sandbox Setup - Step by Step

## Get Your PayPal Credentials

### Step 1: Create PayPal Developer Account

1. Go to https://developer.paypal.com/
2. Click "Sign Up" (top right)
3. Enter email and create password
4. Verify email
5. Complete profile information

### Step 2: Access Sandbox Credentials

1. Go to https://developer.paypal.com/dashboard/
2. Left sidebar → **Apps & Credentials**
3. Make sure you're on **Sandbox** tab (not Live)
4. Under **Accounts** section, you'll see:
   - **Business Account** (merchant/seller)
   - **Personal Account** (buyer)

### Step 3: Get Your Client ID

1. Click **Accounts** tab
2. Under "Sandbox Business Account", click **View**
3. Copy the **Client ID** (this is your merchant credentials)
4. Click **Show** under "Secret" to see Client Secret

### Step 4: Create a Buyer Account (for testing)

1. Still in **Apps & Credentials**
2. Go to **Accounts** tab
3. Click **Create Account**
4. Select **Personal** (buyer account)
5. Choose country (e.g., United States)
6. Click **Create**
7. You'll get credentials like:
   ```
   Email: sb-xxxxx@personal.example.com
   Password: [shown on screen]
   ```
   **Save these** - you'll use them to test PayPal payments

### Step 5: Add to Your Project

In `.env.local`:
```
PAYPAL_CLIENT_ID=AWOiIHnjt5YkwFvto4f6dNsPItUUrdxGs8lXHUUgrAPVNlft9kTxM17aqKJVMfuq9SI_SIuf5iJHwZgq...
PAYPAL_CLIENT_SECRET=EBpMWhkDf15ma9aKoqI20qEnFXcavP7gSKbkMh6jhw2dE3J-oGOMTmKaiYBOqakwIp_nHyINzKJ7slUG...
```

## Testing Your PayPal Integration

### Full Payment Flow Test

1. **Start your local server**
   ```bash
   npm run dev
   # or however you start your app
   ```

2. **Navigate to Wallet page**
   - Click "Deposit" button
   - Select PayPal option

3. **Complete PayPal Payment**
   - You'll be redirected to PayPal sandbox
   - Login with buyer credentials (sb-xxxxx@personal.example.com)
   - Review payment
   - Click "Pay Now"
   - You'll return to your app

4. **Verify in Database**
   - Go to Supabase Dashboard
   - Open **SQL Editor**
   - Run:
   ```sql
   SELECT * FROM public.deposits ORDER BY created_at DESC LIMIT 1;
   ```
   - Check that status is 'completed'

### Sandbox vs Live Differences

| Feature | Sandbox | Production |
|---------|---------|-----------|
| URL | api.sandbox.paypal.com | api.paypal.com |
| Credentials | Use sandbox accounts | Use live merchant account |
| Testing | Free, no real money | Real transactions |
| Data | Isolated, resets | Permanent records |

## Common Testing Scenarios

### Successful Payment
- Use any sandbox buyer account
- Enter any expiration date in future
- Result: Payment completes

### Insufficient Funds
- Use a specific test account from PayPal docs
- (PayPal provides test cards for different scenarios)

### Declined Payment
- PayPal sandbox provides test cards for this
- Check: https://developer.paypal.com/tools/sandbox/

## Switching to Production

When ready to go live:

1. **Get Live Credentials**
   - In PayPal Dashboard, switch to **Live** tab
   - Copy your Live Client ID and Secret

2. **Update Code**
   - Change `api.sandbox.paypal.com` → `api.paypal.com`
   - Update .env with Live credentials
   - Update PayPal script in HTML to use Live Client ID

3. **Test with Small Amount**
   - Make a real payment for $0.01-$1.00
   - Verify it completes
   - Check PayPal account

4. **Deploy**
   - Update Supabase functions with live config
   - Deploy to production

## Debugging

### Check Sandbox Transaction History
1. Go to https://developer.paypal.com/dashboard/
2. Click **Sandbox → Accounts**
3. Click your business account email
4. Go to **Transactions** tab
5. See all test payments

### Common Issues

**"Invalid Client ID"**
- ✓ Double-check copy-paste accuracy
- ✓ Confirm you're using Sandbox ID (not Live)
- ✓ Restart server after .env change

**"Order not approved"**
- ✓ Make sure you click "Pay Now" on PayPal
- ✓ Check PayPal return URL in order creation

**"Verification failed"**
- ✓ Check Supabase Edge Function logs
- ✓ Verify environment variables are set
- ✓ Confirm order was created successfully

## PayPal Dashboard Quick Links

- **Main Dashboard:** https://developer.paypal.com/dashboard/
- **Apps & Credentials:** https://developer.paypal.com/dashboard/apps/
- **Sandbox Transactions:** https://developer.paypal.com/dashboard/activity/
- **Documentation:** https://developer.paypal.com/docs/checkout/

## Next: Implement the Wallet Page

Once you have credentials:
1. Read `PAYPAL_SETUP.md` for integration steps
2. Update `pages/wallet.html`
3. Deploy Supabase functions
4. Test the flow

Questions? Check PayPal docs: https://developer.paypal.com/docs/checkout/
