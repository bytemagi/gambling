import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYPAL_API = 'https://api.sandbox.paypal.com'; // Change to https://api.paypal.com for production
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET');
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

// Verify PayPal order
async function verifyPayPalOrder(orderId: string, accessToken: string) {
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`PayPal API error: ${response.statusText}`);
  }

  return await response.json();
}

// Capture payment
async function capturePayment(orderId: string, accessToken: string) {
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`PayPal capture error: ${response.statusText}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { orderId, userId } = await req.json();

    if (!orderId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing orderId or userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Verify order exists
    const order = await verifyPayPalOrder(orderId, accessToken);

    if (order.status !== 'APPROVED') {
      return new Response(JSON.stringify({ error: 'Order not approved' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Capture payment
    const capturedOrder = await capturePayment(orderId, accessToken);

    if (capturedOrder.status !== 'COMPLETED') {
      return new Response(JSON.stringify({ error: 'Payment capture failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Extract amount and payer info
    const purchaseUnit = capturedOrder.purchase_units[0];
    const amountValue = parseInt(purchaseUnit.amount.value) * 100; // Convert to cents
    const payerId = capturedOrder.payer.payer_info?.payer_id || capturedOrder.payer.email_address;

    // Check if deposit already exists
    const { data: existingDeposit } = await supabase
      .from('deposits')
      .select('id')
      .eq('paypal_order_id', orderId)
      .single();

    if (existingDeposit) {
      return new Response(JSON.stringify({ error: 'Deposit already processed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Get user profile to verify ownership and get username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, balance')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Insert deposit record
    const { error: depositError, data: deposit } = await supabase
      .from('deposits')
      .insert({
        user_id: userId,
        username: profile.username,
        amount: amountValue,
        paypal_order_id: orderId,
        paypal_payer_id: payerId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: { order: capturedOrder },
      })
      .select()
      .single();

    if (depositError) {
      return new Response(JSON.stringify({ error: 'Failed to record deposit' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Credit user balance
    const { data: updatedProfile, error: creditError } = await supabase
      .rpc('credit_balance', { p_user_id: userId, p_amount: amountValue });

    if (creditError) {
      return new Response(JSON.stringify({ error: 'Failed to credit balance' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        deposit,
        newBalance: profile.balance + amountValue,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
