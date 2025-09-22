import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, userId, contractId, email, code } = body;

    if (!type || (!userId && !contractId)) {
      return NextResponse.json(
        { error: 'Missing required fields: type and either userId or contractId' },
        { status: 400 }
      );
    }

    // This is a stub implementation
    // In production, you would integrate with an email service like SendGrid, Mailgun, etc.

    console.log('📧 Email notification:', {
      type,
      userId,
      contractId,
      email,
      code: code ? '***' + code.slice(-3) : undefined,
      timestamp: new Date().toISOString()
    });

    // Handle different email types
    switch (type) {
      case 'challenge_started':
        const { planType, amount } = body;
        console.log(`📧 Sending welcome email to user ${userId} for ${planType} challenge ($${amount})`);
        break;

      case 'challenge_completed':
        console.log(`📧 Sending completion congratulations to user ${userId}`);
        break;

      case 'payment_failed':
        console.log(`📧 Sending payment failure notification to user ${userId}`);
        break;

      case 'contract_verification':
        if (!contractId) {
          return NextResponse.json(
            { error: 'contractId required for contract verification' },
            { status: 400 }
          );
        }

        // Generate verification code for contract signing
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update contract with verification code
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            verification_code: verificationCode,
            code_expires_at: expiresAt.toISOString()
          })
          .eq('id', contractId);

        if (updateError) {
          console.error('Error updating contract:', updateError);
          return NextResponse.json(
            { error: 'Failed to generate verification code' },
            { status: 500 }
          );
        }

        console.log(`📧 Sending contract verification code ${verificationCode} for contract ${contractId}`);
        break;

      case 'contract_signed':
        console.log(`📧 Sending contract signed confirmation to user ${userId}`);
        break;

      case 'admin_notification':
        const { subject, message } = body;
        console.log(`📧 Sending admin notification: ${subject}`);
        break;

      default:
        console.log(`📧 Sending ${type} notification`);
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully (stub)',
      emailType: type,
      userId: userId,
      contractId: contractId,
      ...(type === 'contract_verification' && { verificationCode: verificationCode })
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', message: error.message },
      { status: 500 }
    );
  }
}

// Endpoint to verify contract signing code
export async function PUT(request) {
  try {
    const body = await request.json();
    const { contractId, code, ipAddress, userAgent } = body;

    if (!contractId || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: contractId, code' },
        { status: 400 }
      );
    }

    // Verify code and check expiration
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .eq('verification_code', code)
      .gt('code_expires_at', new Date().toISOString())
      .single();

    if (error || !contract) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Update contract as signed
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_ip: ipAddress,
        signed_user_agent: userAgent,
        verification_code: null,
        code_expires_at: null
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Error updating contract:', updateError);
      return NextResponse.json(
        { error: 'Failed to sign contract' },
        { status: 500 }
      );
    }

    // Log the signing action
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: contract.user_id, // User signing their own contract
        action: 'sign_contract',
        entity_type: 'contract',
        entity_id: contractId,
        notes: `Contract ${contract.type} v${contract.version} signed by user`
      });

    return NextResponse.json({
      success: true,
      message: 'Contract signed successfully',
      contractId: contractId
    });

  } catch (error) {
    console.error('Contract verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify contract', message: error.message },
      { status: 500 }
    );
  }
}
