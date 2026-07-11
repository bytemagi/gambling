// PayPal Integration for Play-Money Deposits
// Include this in your HTML: <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>

const PAYPAL_CONFIG = {
  // Get these from https://developer.paypal.com/dashboard/
  // Replace with your actual Client ID
  clientId: 'YOUR_PAYPAL_CLIENT_ID',
  
  // Deposit amounts in cents (USD)
  amounts: {
    small: { value: 500, label: '5.00', points: 500 },
    medium: { value: 2000, label: '20.00', points: 2000 },
    large: { value: 5000, label: '50.00', points: 5000 },
    custom: null, // User can enter custom amount
  },
  
  // Supabase Edge Function URL
  verifyDepositUrl: 'https://lxzpltvuauzkgddjsplb.supabase.co/functions/v1/verify-deposit',
};

// Initialize PayPal
async function initializePayPal() {
  if (typeof paypal === 'undefined') {
    console.error('PayPal SDK not loaded. Add <script> tag with PayPal SDK.');
    return;
  }

  return paypal;
}

// Create PayPal button for a specific amount
async function createPayPalButton(containerId, amountInCents) {
  const paypalSdk = await initializePayPal();
  
  const amountInDollars = (amountInCents / 100).toFixed(2);
  const userId = await getCurrentUserId(); // You need to provide this function

  if (!paypalSdk) return;

  paypalSdk.Buttons({
    createOrder: async (data, actions) => {
      return actions.order.create({
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amountInDollars,
            },
            description: `Deposit ${amountInDollars} for community points`,
          },
        ],
        intent: 'CAPTURE',
      });
    },

    onApprove: async (data, actions) => {
      try {
        // Show loading state
        document.getElementById(containerId).innerHTML = '<p>Processing payment...</p>';

        // Verify payment with your backend
        const response = await fetch(PAYPAL_CONFIG.verifyDepositUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: data.orderID,
            userId: userId,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Payment successful
          showSuccessMessage(`Deposit of $${amountInDollars} successful! You received ${amountInCents} points.`);
          
          // Refresh balance in UI
          updateBalanceDisplay(result.newBalance);
          
          // Close deposit modal
          closeDepositModal();
          
          // Redirect to game or show next steps
          setTimeout(() => {
            window.location.href = '/pages/index.html';
          }, 2000);
        } else {
          throw new Error(result.error || 'Verification failed');
        }
      } catch (error) {
        console.error('Error:', error);
        showErrorMessage(`Payment failed: ${error.message}`);
        
        // Restore button
        document.getElementById(containerId).innerHTML = '';
        createPayPalButton(containerId, amountInCents);
      }
    },

    onError: (err) => {
      console.error('PayPal error:', err);
      showErrorMessage('Payment error. Please try again.');
    },

    onCancel: () => {
      showErrorMessage('Payment cancelled.');
    },
  }).render(`#${containerId}`);
}

// UI Helper Functions
function showSuccessMessage(message) {
  const modal = document.getElementById('depositModal');
  if (modal) {
    modal.innerHTML = `
      <div class="modal-box">
        <h2 style="color: var(--green);">✓ Success</h2>
        <p style="color: var(--muted); margin-top: 16px;">${message}</p>
        <p style="color: var(--muted); font-size: 0.8rem; margin-top: 12px;">Redirecting...</p>
      </div>
    `;
  }
}

function showErrorMessage(message) {
  const alert = document.createElement('div');
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #c0392b;
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 0.9rem;
  `;
  alert.textContent = message;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

function updateBalanceDisplay(newBalance) {
  const balanceElement = document.getElementById('walletBalance');
  if (balanceElement) {
    balanceElement.textContent = newBalance;
  }
  // Also update header balance
  const headerBalance = document.getElementById('bal');
  if (headerBalance) {
    headerBalance.textContent = newBalance;
  }
}

function closeDepositModal() {
  const modal = document.getElementById('depositModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Get current user ID (you need to implement this based on your auth)
async function getCurrentUserId() {
  // Use Supabase client from shared.js
  const { data, error } = await db.auth.getUser();
  if (error || !data?.user?.id) {
    throw new Error('User not authenticated');
  }
  return data.user.id;
}

// Export for use in HTML
window.PayPalIntegration = {
  createPayPalButton,
  initializePayPal,
};
