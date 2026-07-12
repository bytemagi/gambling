import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
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
    const { userId, referralCode = '', username = '' } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing userId' }), { status: 400, headers: commonHeaders() });
    }

    const normalizedReferralCode = String(referralCode || '').trim().toUpperCase();
    const bonusAmount = 500;

    const { data: userProfile } = await supabase.from('profiles').select('id, balance, referral_code, referred_by').eq('id', userId).single();
    if (!userProfile) {
      return new Response(JSON.stringify({ ok: false, error: 'Profile not found' }), { status: 404, headers: commonHeaders() });
    }

    const hasReferral = Boolean(normalizedReferralCode);
    let referrerProfile = null;
    if (hasReferral) {
      const { data: referrer } = await supabase.from('profiles').select('id, balance').eq('referral_code', normalizedReferralCode).single();
      referrerProfile = referrer;
    }

    if (referrerProfile?.id && referrerProfile.id !== userId) {
      await supabase.rpc('credit_balance', { p_user_id: referrerProfile.id, p_amount: bonusAmount });
      await supabase.from('profiles').update({ referred_by: normalizedReferralCode }).eq('id', userId).select().single();
      await supabase.from('bets').insert({
        user_id: referrerProfile.id,
        username: username || 'referrer',
        game: 'referral',
        amount: 0,
        outcome: { result: 'referral', win: true, delta: bonusAmount },
        balance_after: null,
      });
    }

    const newBalance = userProfile.balance + bonusAmount;
    await supabase.rpc('credit_balance', { p_user_id: userId, p_amount: bonusAmount });

    if (referrerProfile?.id && referrerProfile.id !== userId) {
      await supabase.from('bets').insert({
        user_id: userId,
        username: username || 'player',
        game: 'referral',
        amount: 0,
        outcome: { result: 'signup-bonus', win: true, delta: bonusAmount },
        balance_after: newBalance,
      });
    }

    return new Response(JSON.stringify({ ok: true, bonusAmount, credited: true }), { headers: commonHeaders() });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: commonHeaders() });
  }
});
