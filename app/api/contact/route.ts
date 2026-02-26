import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get SMTP credentials from environment variables
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // If no SMTP credentials, return error
    if (!smtpUser || !smtpPass) {
      console.error('SMTP credentials not configured');
      return NextResponse.json(
        {
          error: 'Email service not configured. Please contact support directly at support@brokenomore.in',
        },
        { status: 500 }
      );
    }

    // Log credentials (without showing password) for debugging
    console.log('SMTP Config:', {
      user: smtpUser,
      passLength: smtpPass?.length,
    });

    // Clean credentials
    const cleanUser = smtpUser.trim();
    const cleanPass = smtpPass.trim().replace(/\s+/g, ''); // Remove all spaces from password

    console.log('Attempting SMTP connection with:', {
      user: cleanUser,
      host: 'smtp.zoho.com',
      passLength: cleanPass.length,
    });

    // Try different Zoho SMTP configurations
    // Based on Zoho Mail settings: smtppro.zoho.in:465 (SSL)
    const smtpConfigs = [
      { host: 'smtppro.zoho.in', port: 465, secure: true },  // Zoho Pro SMTP (SSL) - Primary
      { host: 'smtppro.zoho.in', port: 587, secure: false }, // Zoho Pro SMTP (TLS) - Fallback
      { host: 'smtp.zoho.com', port: 465, secure: true },    // Standard SSL
      { host: 'smtp.zoho.com', port: 587, secure: false },   // Standard TLS
      { host: 'smtp.zoho.in', port: 465, secure: true },     // India region SSL
      { host: 'smtp.zoho.in', port: 587, secure: false },    // India region TLS
    ];

    let transporter: nodemailer.Transporter | null = null;
    let lastError: any = null;

    // Try each configuration
    for (const config of smtpConfigs) {
      try {
        console.log(`Trying ${config.host}:${config.port} (secure: ${config.secure})...`);
        
        transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: cleanUser,
            pass: cleanPass,
          },
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3',
          },
          debug: true, // Enable debug mode
          logger: true, // Enable logging
        });

        // Try to verify connection (but don't fail if it doesn't work)
        try {
          await transporter.verify();
          console.log(`✓ SMTP connection verified on ${config.host}:${config.port}`);
          break; // Success, exit loop
        } catch (verifyErr: any) {
          console.log(`✗ Verification failed on ${config.host}:${config.port}:`, verifyErr.message);
          // Continue to next config
          lastError = verifyErr;
          transporter = null;
        }
      } catch (err: any) {
        console.log(`✗ Connection failed on ${config.host}:${config.port}:`, err.message);
        lastError = err;
        transporter = null;
      }
    }

    // If all configs failed, try one more time with just sending (no verify)
    if (!transporter) {
      console.log('All verification attempts failed. Trying direct send with smtppro.zoho.in:465...');
      transporter = nodemailer.createTransport({
        host: 'smtppro.zoho.in',
        port: 465,
        secure: true,
        auth: {
          user: cleanUser,
          pass: cleanPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    // Escape HTML to prevent XSS
    const escapeHtml = (text: string) => {
      const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    // Email content - FROM: your Zoho account, TO: support@brokenomore.in, REPLY-TO: user's email
    const mailOptions = {
      from: `"BrokeNoMore Contact Form" <${smtpUser}>`,
      to: 'support@brokenomore.in',
      replyTo: `"${escapeHtml(name)}" <${email}>`, // This allows you to reply directly to the user
      subject: `Contact Form: ${escapeHtml(subject)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6B46C1;">New Contact Form Submission</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${escapeHtml(email)}</a></p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="color: #666; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            This email was sent from the BrokeNoMore website contact form.<br>
            You can reply directly to this email to respond to ${escapeHtml(name)}.
          </p>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This email was sent from the BrokeNoMore website contact form.
You can reply directly to this email to respond to ${name}.
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to support@brokenomore.in');

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send email. Please try again later.';
    if (error.code === 'EAUTH' || error.message?.includes('Authentication') || error.message?.includes('535')) {
      errorMessage = `Authentication failed. Please verify:
1. SMTP_USER is your primary Zoho account email (not an alias)
2. SMTP_PASS is the correct app-specific password (without spaces)
3. App password is active in Zoho Security settings
4. SMTP access is enabled for your Zoho account`;
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to email server. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('Final error message:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

