#!/usr/bin/env node

import { randomUUID } from 'crypto';
import process from 'process';
import dayjs from 'dayjs';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';

async function main() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.error('❌ Supabase admin client is not configured. Check environment variables.');
    process.exit(1);
  }

  const userId = 'seed-customer-001';
  const affiliateCode = 'AFF-SEED-001';
  const now = new Date().toISOString();

  const customerPayload = {
    id: userId,
    email: 'client@example.com',
    full_name: 'Seed Customer',
    customer_number: 'CUST-1001',
    verified: true,
    blacklisted: false,
    notes: [
      {
        text: 'Initial seeded note for admin demo.',
        author: 'system',
        createdAt: now
      }
    ],
    created_at: now,
    updated_at: now
  };

  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (existingUserError) {
    console.error('❌ Failed checking existing user:', existingUserError.message);
    process.exit(1);
  }

  if (!existingUser) {
    const { error: insertUserError } = await supabaseAdmin.from('users').insert(customerPayload);
    if (insertUserError) {
      console.error('❌ Failed inserting user:', insertUserError.message);
      process.exit(1);
    }
    console.log('✅ Seed user inserted.');
  } else {
    console.log('ℹ️ Seed user already exists. Skipping user insert.');
  }

  const planId = 'seed-plan-001';
  const planPayload = {
    id: planId,
    type: '1-step',
    size: 100000,
    fee: 499,
    params: {
      profit_target: 10,
      drawdown_max: 5,
      exposure_cap: 15
    },
    active: true,
    created_at: now,
    updated_at: now
  };

  const { error: planError } = await supabaseAdmin.from('plans').upsert(planPayload, { onConflict: 'id' });
  if (planError) {
    console.error('❌ Failed upserting plan:', planError.message);
    process.exit(1);
  }

  const affiliateId = randomUUID();
  let ensuredAffiliateId = affiliateId;

  const { data: existingAffiliate, error: affiliateCheckError } = await supabaseAdmin
    .from('affiliates')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (affiliateCheckError) {
    console.error('❌ Failed checking existing affiliate:', affiliateCheckError.message);
    process.exit(1);
  }

  if (!existingAffiliate) {
    const { error: affiliateInsertError, data: affiliateInsertData } = await supabaseAdmin
      .from('affiliates')
      .insert({
        id: affiliateId,
        user_id: userId,
        affiliate_id: affiliateCode,
        custom_name: 'Seed Affiliate',
        contract_status: 'approved',
        referrals_count: 3,
        current_tier: 1,
        payout_email: 'affiliate-payout@example.com',
        auto_withdraw_email: 'affiliate-auto@example.com',
        withdrawal_delay: 7,
        withdrawal_threshold: 150,
        promotion_info: 'Seeded affiliate for dashboard demo.',
        custom_commission: { base_percent: 12.5 },
        website: 'https://example.com'
      })
      .select('id')
      .single();

    if (affiliateInsertError) {
      console.error('❌ Failed inserting affiliate:', affiliateInsertError.message);
      process.exit(1);
    }

    ensuredAffiliateId = affiliateInsertData.id;
    console.log('✅ Seed affiliate inserted.');
  } else {
    ensuredAffiliateId = existingAffiliate.id;
    console.log('ℹ️ Seed affiliate already exists.');
  }

  const orderId = randomUUID();
  const { error: orderInsertError } = await supabaseAdmin.from('orders').insert({
    id: orderId,
    order_id: 'ORD-1001',
    plan_id: planId,
    user_id: userId,
    addons: [],
    amount: 499,
    affiliate_id: ensuredAffiliateId,
    status: 'completed',
    payment_method: 'stripe',
    created_at: now,
    updated_at: now
  });

  if (orderInsertError && orderInsertError.code !== '23505') {
    console.error('❌ Failed inserting order:', orderInsertError.message);
    process.exit(1);
  } else if (!orderInsertError) {
    console.log('✅ Seed order inserted.');
  } else {
    console.log('ℹ️ Seed order already exists.');
  }

  const challengeId = randomUUID();
  const { error: challengeInsertError } = await supabaseAdmin.from('challenges').insert({
    id: challengeId,
    user_id: userId,
    plan_type: '1-step',
    balance: 100000,
    params: {
      profit_target: 10,
      drawdown_max: 5,
      daily_loss_limit: 4
    },
    status: 'active',
    created_at: now,
    updated_at: now
  });

  if (challengeInsertError && challengeInsertError.code !== '23505') {
    console.error('❌ Failed inserting challenge:', challengeInsertError.message);
    process.exit(1);
  } else if (!challengeInsertError) {
    console.log('✅ Seed challenge inserted.');
  } else {
    console.log('ℹ️ Seed challenge already exists.');
  }

  const commissionId = randomUUID();
  const { error: commissionInsertError } = await supabaseAdmin.from('affiliate_commissions').insert({
    id: commissionId,
    affiliate_id: ensuredAffiliateId,
    order_id: orderId,
    amount: 62.37,
    status: 'pending',
    manual: false,
    note: 'Initial commission awaiting payout.',
    created_at: now
  });

  if (commissionInsertError && commissionInsertError.code !== '23505') {
    console.error('❌ Failed inserting commission:', commissionInsertError.message);
    process.exit(1);
  } else if (!commissionInsertError) {
    console.log('✅ Seed commission inserted.');
  } else {
    console.log('ℹ️ Seed commission already exists.');
  }

  const referralId = randomUUID();
  const { error: referralInsertError } = await supabaseAdmin.from('affiliate_referrals').insert({
    id: referralId,
    affiliate_id: ensuredAffiliateId,
    referred_user_id: userId,
    order_id: orderId,
    level: 1,
    commission_id: commissionId,
    amount: 62.37,
    created_at: now
  });

  if (referralInsertError && referralInsertError.code !== '23505') {
    console.error('❌ Failed inserting referral:', referralInsertError.message);
    process.exit(1);
  } else if (!referralInsertError) {
    console.log('✅ Seed referral inserted.');
  } else {
    console.log('ℹ️ Seed referral already exists.');
  }

  console.log('🎉 Seeding complete. Load /admin/customers to verify.');
}

main().catch((error) => {
  console.error('❌ Seed script failed:', error);
  process.exit(1);
});
