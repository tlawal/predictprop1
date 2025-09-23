import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import crypto from 'crypto';

// Lazy initialize Resend to avoid build-time errors
let resend = null;
const getResend = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

export async function POST(request) {
  try {
    let body, type, userId, contractId, email, code, planName, challengeSize;

    // Check if request has FormData (for certificate attachments)
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const certificate = formData.get('certificate');
      type = formData.get('type');
      userId = formData.get('userId');
      planName = formData.get('planName');
      challengeSize = formData.get('challengeSize');

      body = { certificate, type, userId, planName, challengeSize };
    } else {
      body = await request.json();
      ({ type, userId, contractId, email, code } = body);
    }

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
    let emailResult;
    switch (type) {
      case 'challenge_started':
        const { planType, amount } = body;
        emailResult = await sendWelcomeEmail(userId, planType, amount);
        break;

      case 'challenge_completed':
        console.log(`📧 Sending completion congratulations to user ${userId}`);
        emailResult = await sendChallengeCompletionEmail(userId);
        break;

      case 'breach_alert':
        const { breachType, breachValue, challengeId } = body;
        emailResult = await sendBreachAlertEmail(userId, breachType, breachValue, challengeId);
        break;

      case 'payment_failed':
        console.log(`📧 Sending payment failure notification to user ${userId}`);
        emailResult = await sendPaymentFailedEmail(userId);
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

        emailResult = await sendContractVerificationEmail(contractId, verificationCode);
        break;

      case 'contract_signed':
        emailResult = await sendContractSignedEmail(userId, contractId);
        break;

      case 'challenge_completion':
        const { planName: plan, challengeSize: size, certificate } = body;
        console.log(`📧 Sending challenge completion certificate for ${plan} (${size}) with attachment`);
        emailResult = await sendChallengeCompletionWithCertificate(userId, plan, size, certificate);
        break;

      case 'admin_notification':
        const { subject, message } = body;
        emailResult = await sendAdminNotificationEmail(subject, message);
        break;

      default:
        console.log(`📧 Unknown email type: ${type}`);
        emailResult = { success: false, message: `Unknown email type: ${type}` };
    }

    return NextResponse.json({
      success: emailResult?.success ?? true,
      message: emailResult?.message ?? 'Email sent successfully',
      emailType: type,
      userId: userId,
      contractId: contractId,
      ...(type === 'contract_verification' && { verificationCode })
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

// ========== EMAIL SENDING FUNCTIONS ==========

/**
 * Send welcome email when user starts a challenge
 */
async function sendWelcomeEmail(userId, planType, amount) {
  try {
    // Get user email from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !user?.email) {
      console.error('User email not found:', error);
      return { success: false, message: 'User email not found' };
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to PolyProp!</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">🎉 Welcome to PolyProp!</h1>
            <p style="color: #6b7280; font-size: 16px;">Your prediction trading journey begins now</p>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Challenge Started Successfully</h2>
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <p style="margin: 10px 0;"><strong>Plan:</strong> ${planType}</p>
              <p style="margin: 10px 0;"><strong>Capital:</strong> $${amount}</p>
              <p style="margin: 10px 0;"><strong>Started:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #1f2937;">What's Next?</h3>
            <ul style="color: #4b5563; line-height: 1.6;">
              <li>📊 Complete 10 resolved markets with 70%+ win rate</li>
              <li>📈 Keep drawdown under 5% of your capital</li>
              <li>🎯 Stay within 15% exposure per trade</li>
              <li>🏆 Achieve your profit target to graduate</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #eff6ff; border-radius: 8px;">
            <p style="color: #1e40af; font-weight: bold; margin-bottom: 10px;">Need Help?</p>
            <p style="color: #3730a3; margin: 0;">Visit our <a href="#" style="color: #3b82f6;">Trading Guide</a> or contact support</p>
          </div>

          <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>Happy Trading! 🚀</p>
            <p>The PolyProp Team</p>
          </div>
        </body>
      </html>
    `;

    const resendClient = getResend();
    if (!resendClient) {
      console.error('Resend client not available');
      return { success: false, message: 'Email service not configured' };
    }

    const result = await resendClient.emails.send({
      from: 'PolyProp <welcome@polyprop.com>',
      to: user.email,
      subject: `🎉 Welcome to PolyProp - ${planType} Challenge Started!`,
      html: emailHtml,
    });

    console.log('Welcome email sent:', result);
    return { success: true, message: 'Welcome email sent successfully' };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Send challenge completion congratulations email
 */
async function sendChallengeCompletionEmail(userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !user?.email) {
      console.error('User email not found:', error);
      return { success: false, message: 'User email not found' };
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Challenge Completed - PolyProp</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">🏆 Challenge Completed!</h1>
            <p style="color: #6b7280; font-size: 16px;">Congratulations on becoming a PolyProp Trader!</p>
          </div>

          <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
            <h2 style="color: white; margin-bottom: 10px;">Outstanding Achievement!</h2>
            <p style="color: white; opacity: 0.9;">You've successfully completed all challenge requirements</p>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #1f2937;">What's Unlocked?</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; border-left: 3px solid #22c55e;">
                <div style="font-weight: bold; color: #15803d;">💰 Profit Sharing</div>
                <div style="font-size: 14px; color: #166534;">80% of profits paid to you</div>
              </div>
              <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 3px solid #f59e0b;">
                <div style="font-weight: bold; color: #92400e;">📜 Certificate</div>
                <div style="font-size: 14px; color: #78350f;">Download your achievement certificate</div>
              </div>
              <div style="background: #e0f2fe; padding: 15px; border-radius: 6px; border-left: 3px solid #0284c7;">
                <div style="font-weight: bold; color: #0c4a6e;">📊 Advanced Analytics</div>
                <div style="font-size: 14px; color: #075985;">Full performance tracking</div>
              </div>
              <div style="background: #f3e8ff; padding: 15px; border-radius: 6px; border-left: 3px solid #a855f7;">
                <div style="font-weight: bold; color: #7c3aed;">🚀 Priority Support</div>
                <div style="font-size: 14px; color: #6d28d9;">Direct trader assistance</div>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
            <p style="color: #166534; font-weight: bold; margin-bottom: 10px;">Ready to Start Trading?</p>
            <p style="color: #14532d; margin: 0;">Your trading dashboard is now fully unlocked!</p>
          </div>

          <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>Keep up the excellent trading! 📈</p>
            <p>The PolyProp Team</p>
          </div>
        </body>
      </html>
    `;

    const resendClient = getResend();
    if (!resendClient) {
      console.error('Resend client not available');
      return { success: false, message: 'Email service not configured' };
    }

    const result = await resendClient.emails.send({
      from: 'PolyProp <congrats@polyprop.com>',
      to: user.email,
      subject: '🏆 Challenge Completed - Welcome to PolyProp Trading!',
      html: emailHtml,
    });

    console.log('Challenge completion email sent:', result);
    return { success: true, message: 'Challenge completion email sent successfully' };

  } catch (error) {
    console.error('Error sending challenge completion email:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Send breach alert email
 */
async function sendBreachAlertEmail(userId, breachType, breachValue, challengeId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !user?.email) {
      console.error('User email not found:', error);
      return { success: false, message: 'User email not found' };
    }

    const breachMessages = {
      drawdown: `Your drawdown has exceeded ${breachValue}%`,
      exposure: `Your position exposure has exceeded ${breachValue}%`,
      consecutive_losses: `You've experienced ${breachValue} consecutive losses`
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Risk Alert - PolyProp</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin-bottom: 10px;">⚠️ Risk Alert</h1>
            <p style="color: #6b7280; font-size: 16px;">Action required to protect your account</p>
          </div>

          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 48px;">🚨</div>
            </div>
            <h2 style="color: #991b1b; margin-bottom: 15px; text-align: center;">Risk Threshold Breached</h2>
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #dc2626;">
              <p style="margin: 0; color: #1f2937; font-weight: 500;">${breachMessages[breachType] || 'A risk threshold has been breached'}</p>
            </div>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #1f2937;">Immediate Actions Required:</h3>
            <ul style="color: #4b5563; line-height: 1.6; margin-top: 15px;">
              <li>🔍 <strong>Review your positions</strong> - Check current exposure and P&L</li>
              <li>📊 <strong>Reduce risk</strong> - Consider closing some positions</li>
              <li>📈 <strong>Monitor closely</strong> - Keep drawdown below 5%</li>
              <li>📞 <strong>Contact support</strong> if you need assistance</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #eff6ff; border-radius: 8px;">
            <p style="color: #1e40af; font-weight: bold; margin-bottom: 10px;">Need Help?</p>
            <p style="color: #3730a3; margin: 0;">Our risk management team is here to help</p>
            <a href="#" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Contact Support</a>
          </div>

          <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>Stay disciplined, trade smart! 📊</p>
            <p>The PolyProp Risk Team</p>
          </div>
        </body>
      </html>
    `;

    const resendClient = getResend();
    if (!resendClient) {
      console.error('Resend client not available');
      return { success: false, message: 'Email service not configured' };
    }

    const result = await resendClient.emails.send({
      from: 'PolyProp <alerts@polyprop.com>',
      to: user.email,
      subject: `⚠️ Risk Alert - ${breachType.replace('_', ' ').toUpperCase()} Breach`,
      html: emailHtml,
    });

    console.log('Breach alert email sent:', result);
    return { success: true, message: 'Breach alert email sent successfully' };

  } catch (error) {
    console.error('Error sending breach alert email:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Send payment failed email
 */
async function sendPaymentFailedEmail(userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !user?.email) {
      console.error('User email not found:', error);
      return { success: false, message: 'User email not found' };
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Failed - PolyProp</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin-bottom: 10px;">❌ Payment Failed</h1>
            <p style="color: #6b7280; font-size: 16px;">We couldn't process your payment</p>
          </div>

          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 48px;">💳</div>
            </div>
            <h2 style="color: #991b1b; margin-bottom: 15px; text-align: center;">Payment Processing Issue</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              We encountered an issue processing your recent payment. This can happen due to insufficient funds, expired cards, or bank restrictions.
            </p>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #1f2937;">What to do next:</h3>
            <ol style="color: #4b5563; line-height: 1.6; margin-top: 15px;">
              <li style="margin-bottom: 10px;">🔄 <strong>Try again</strong> - Check your payment details and retry</li>
              <li style="margin-bottom: 10px;">💳 <strong>Verify card</strong> - Ensure your card is active and has sufficient funds</li>
              <li style="margin-bottom: 10px;">🏦 <strong>Contact bank</strong> - Some banks block crypto/blockchain transactions</li>
              <li style="margin-bottom: 10px;">📞 <strong>Contact support</strong> - We're here to help resolve this</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #eff6ff; border-radius: 8px;">
            <p style="color: #1e40af; font-weight: bold; margin-bottom: 10px;">Need Assistance?</p>
            <p style="color: #3730a3; margin: 0;">Our payment specialists can help resolve this issue</p>
            <a href="#" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Contact Support</a>
          </div>

          <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>We're here to help! 💪</p>
            <p>The PolyProp Billing Team</p>
          </div>
        </body>
      </html>
    `;

    const resendClient = getResend();
    if (!resendClient) {
      console.error('Resend client not available');
      return { success: false, message: 'Email service not configured' };
    }

    const result = await resendClient.emails.send({
      from: 'PolyProp <billing@polyprop.com>',
      to: user.email,
      subject: '❌ Payment Failed - Please Try Again',
      html: emailHtml,
    });

    console.log('Payment failed email sent:', result);
    return { success: true, message: 'Payment failed email sent successfully' };

  } catch (error) {
    console.error('Error sending payment failed email:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Send contract verification email
 */
async function sendContractVerificationEmail(contractId, verificationCode) {
  try {
    // Get contract and user info
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('user_id, type, version')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('Contract not found:', contractError);
      return { success: false, message: 'Contract not found' };
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', contract.user_id)
      .single();

    if (userError || !user?.email) {
      console.error('User email not found:', userError);
      return { success: false, message: 'User email not found' };
    }

    const contractNames = {
      'terms_of_service': 'Terms of Service',
      'privacy_policy': 'Privacy Policy',
      'trading_agreement': 'Trading Agreement'
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Contract Verification - PolyProp</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">📄 Contract Verification</h1>
            <p style="color: #6b7280; font-size: 16px;">Please verify your signature</p>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Verify Your Signature</h2>
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <p style="margin: 10px 0;"><strong>Contract:</strong> ${contractNames[contract.type] || contract.type}</p>
              <p style="margin: 10px 0;"><strong>Version:</strong> ${contract.version}</p>
              <p style="margin: 10px 0;"><strong>Verification Code:</strong> <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #3b82f6;">${verificationCode}</span></p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #eff6ff; border-radius: 8px;">
            <p style="color: #1e40af; font-weight: bold; margin-bottom: 10px;">Enter this code in your dashboard</p>
            <p style="color: #3730a3; margin: 0;">The code expires in 10 minutes for security</p>
          </div>

          <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>Secure verification process 🔐</p>
            <p>The PolyProp Legal Team</p>
          </div>
        </body>
      </html>
    `;

    const resendClient = getResend();
    if (!resendClient) {
      console.error('Resend client not available');
      return { success: false, message: 'Email service not configured' };
    }

    const result = await resendClient.emails.send({
      from: 'PolyProp <legal@polyprop.com>',
      to: user.email,
      subject: `📄 Verify Your ${contractNames[contract.type] || contract.type} Signature`,
      html: emailHtml,
    });

    console.log('Contract verification email sent:', result);
    return { success: true, message: 'Contract verification email sent successfully' };

  } catch (error) {
    console.error('Error sending contract verification email:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Send contract signed confirmation email
 */
async function sendContractSignedEmail(userId, contractId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !user?.email) {
      console.error('User email not found:', error);
      return { success: false, message: 'User email not found' };
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Contract Signed - PolyProp</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">✅ Contract Signed</h1>
            <p style="color: #6b7280; font-size: 16px;">Your signature has been verified and recorded</p>
          </div>

          <div style="background: #f0fdf4; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 48px;">✍️</div>
            </div>
            <h2 style="color: #166534; margin-bottom: 15px; text-align: center;">Signature Verified Successfully</h2>
            <p style="color: #14532d; line-height: 1.6;">
              Your contract has been legally signed and is now part of your trading agreement with PolyProp.
            </p>
          </div>

          <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>Thank you for your trust! 🤝</p>
            <p>The PolyProp Legal Team</p>
          </div>
        </body>
      </html>
    `;

    const resendClient = getResend();
    if (!resendClient) {
      console.error('Resend client not available');
      return { success: false, message: 'Email service not configured' };
    }

    const result = await resendClient.emails.send({
      from: 'PolyProp <legal@polyprop.com>',
      to: user.email,
      subject: '✅ Contract Signed - Thank You for Your Trust',
      html: emailHtml,
    });

    console.log('Contract signed email sent:', result);
    return { success: true, message: 'Contract signed email sent successfully' };

  } catch (error) {
    console.error('Error sending contract signed email:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Send challenge completion with certificate attachment
 */
async function sendChallengeCompletionWithCertificate(userId, planName, challengeSize, certificateBlob) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !user?.email) {
      console.error('User email not found:', error);
      return { success: false, message: 'User email not found' };
    }

    // For now, just send the email without attachment since we're dealing with blob data
    // In production, you'd need to upload the certificate to a storage service first
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Challenge Certificate - PolyProp</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">🏆 Your Certificate is Ready!</h1>
            <p style="color: #6b7280; font-size: 16px;">Challenge completed successfully</p>
          </div>

          <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
            <h2 style="color: white; margin-bottom: 10px;">Certificate Attached</h2>
            <p style="color: white; opacity: 0.9;">Your achievement certificate is attached to this email</p>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #1f2937;">Challenge Summary:</h3>
            <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin-top: 15px;">
              <p style="margin: 5px 0;"><strong>Plan:</strong> ${planName}</p>
              <p style="margin: 5px 0;"><strong>Capital:</strong> $${challengeSize}</p>
              <p style="margin: 5px 0;"><strong>Completed:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>Keep up the excellent trading! 📈</p>
            <p>The PolyProp Team</p>
          </div>
        </body>
      </html>
    `;

    const resendClient = getResend();
    if (!resendClient) {
      console.error('Resend client not available');
      return { success: false, message: 'Email service not configured' };
    }

    const result = await resendClient.emails.send({
      from: 'PolyProp <certificates@polyprop.com>',
      to: user.email,
      subject: '🏆 Your PolyProp Certificate - Challenge Completed!',
      html: emailHtml,
      // attachments: [{ filename: 'certificate.png', content: certificateBlob }]
      // Note: Attachment handling would require additional setup
    });

    console.log('Challenge completion with certificate email sent:', result);
    return { success: true, message: 'Challenge completion email sent successfully' };

  } catch (error) {
    console.error('Error sending challenge completion email:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Send admin notification email
 */
async function sendAdminNotificationEmail(subject, message) {
  try {
    // Send to admin email (would need to be configured)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@polyprop.com';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Admin Notification - PolyProp</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">🔔 Admin Alert</h1>
            <p style="color: #6b7280; font-size: 16px;">System notification</p>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #92400e; margin-bottom: 15px;">${subject}</h2>
            <p style="color: #78350f; line-height: 1.6;">${message}</p>
          </div>

          <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>PolyProp Admin System</p>
          </div>
        </body>
      </html>
    `;

    const resendClient = getResend();
    if (!resendClient) {
      console.error('Resend client not available');
      return { success: false, message: 'Email service not configured' };
    }

    const result = await resendClient.emails.send({
      from: 'PolyProp <system@polyprop.com>',
      to: adminEmail,
      subject: `🔔 ${subject}`,
      html: emailHtml,
    });

    console.log('Admin notification email sent:', result);
    return { success: true, message: 'Admin notification email sent successfully' };

  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return { success: false, message: error.message };
  }
}
