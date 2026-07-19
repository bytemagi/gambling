import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseService = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

function commonHeaders() {
  return { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...commonHeaders(), 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing authorization' }), { status: 401, headers: commonHeaders() });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user?.id) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401, headers: commonHeaders() });
    }

    const { referralCode = '' } = await req.json();
    const userId = user.id;

    const normalizedReferralCode = String(referralCode || '').trim().toUpperCase();
    const bonusAmount = 500;

    const { data: userProfile } = await supabaseService.from('profiles').select('id, balance, referral_code, referred_by, signup_bonus_claimed').eq('id', userId).single();
    if (!userProfile) {
      return new Response(JSON.stringify({ ok: false, error: 'Profile not found' }), { status: 404, headers: commonHeaders() });
    }

    if (userProfile.signup_bonus_claimed) {
      return new Response(JSON.stringify({ ok: true, bonusAmount: 0, credited: false, reason: 'Already claimed' }), { headers: commonHeaders() });
    }

    const hasReferral = Boolean(normalizedReferralCode);
    let referrerProfile = null;
    if (hasReferral) {
      const { data: referrer } = await supabaseService.from('profiles').select('id, balance').eq('referral_code', normalizedReferralCode).single();
      referrerProfile = referrer;
    }

    const hasValidReferrer = referrerProfile?.id && referrerProfile.id !== userId;

    if (hasValidReferrer) {
      // Fetch referrer's real username
      const { data: referrerProfileFull } = await supabaseService.from('profiles').select('username').eq('id', referrerProfile.id).single();
      const referrerUsername = referrerProfileFull?.username ?? 'unknown';

      await supabaseService.rpc('credit_balance_for', { p_user_id: referrerProfile.id, p_amount: bonusAmount });
      await supabaseService.from('profiles').update({ referred_by: normalizedReferralCode }).eq('id', userId).select().single();

      // Fetch referrer's balance after credit
      const { data: referrerAfter } = await supabaseService.from('profiles').select('balance').eq('id', referrerProfile.id).single();
      await supabaseService.from('bets').insert({
        user_id: referrerProfile.id,
        username: referrerUsername,
        game: 'referral',
        amount: 0,
        outcome: { result: 'referral', win: true, delta: bonusAmount },
        balance_after: referrerAfter?.balance ?? 0,
      });
    }

    const newBalance = userProfile.balance + bonusAmount;
    // Note: credit_balance uses auth.uid(), but edge functions use service role.
    // Use a direct update instead for the signup bonus credit.
    await supabaseService.from('profiles').update({ balance: newBalance }).eq('id', userId);
    await supabaseService.from('profiles').update({ signup_bonus_claimed: true }).eq('id', userId);

    // Fetch new user's real username
    const { data: newUserProfile } = await supabaseService.from('profiles').select('username').eq('id', userId).single();
    const newUsername = newUserProfile?.username ?? 'unknown';

    if (hasValidReferrer) {
      await supabaseService.from('bets').insert({
        user_id: userId,
        username: newUsername,
        game: 'referral',
        amount: 0,
        outcome: { result: 'signup-bonus', win: true, delta: bonusAmount },
        balance_after: newBalance,
      });
    }

    return new Response(JSON.stringify({ ok: true, bonusAmount, credited: true }), { headers: commonHeaders() });
  } catch (error) {
    console.error('handle-signup-bonus error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Internal server error' }), { status: 500, headers: commonHeaders() });
  }
});
