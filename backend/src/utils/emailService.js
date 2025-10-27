import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

// Load environment variables
dotenv.config();

// Create transporter that supports:
// 1) Gmail with App Password (EMAIL_USER + EMAIL_APP_PASSWORD)
// 2) Generic SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
// 3) Gmail OAuth2 (client_id, client_secret, redirect_url, refresh_token, email_id)
const createTransporter = async () => {
  // Prefer explicit SMTP if provided
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Boolean(process.env.SMTP_SECURE === 'true') || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Gmail App Password path
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });
  }

  // Gmail OAuth2 path (from provided env bundle)
  const clientId = process.env.client_id || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.client_secret || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.redirect_url || process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
  const refreshToken = process.env.refresh_token || process.env.GOOGLE_REFRESH_TOKEN;
  const emailUser = process.env.email_id || process.env.EMAIL_USER;

  if (clientId && clientSecret && refreshToken && emailUser) {
    const oAuth2Client = new OAuth2Client({
      clientId,
      clientSecret,
      redirectUri
    });
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    const { token } = await oAuth2Client.getAccessToken();

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: emailUser,
        clientId,
        clientSecret,
        refreshToken,
        accessToken: token || undefined
      }
    });
  }

  throw new Error('Email transport is not configured. Provide either EMAIL_USER + EMAIL_APP_PASSWORD, SMTP_* settings, or Google OAuth2 credentials.');
};

// Send approval email
export const sendApprovalEmail = async (application, user, password) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"NexCharge Team" <${process.env.EMAIL_USER}>`,
      to: application.companyEmail,
      subject: '🎉 Your Corporate Admin Application Has Been Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #00b894, #00a085); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Application Approved!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Welcome to NexCharge Corporate Network</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3436; margin-top: 0;">Congratulations, ${application.contactPersonName}!</h2>
            
            <p style="color: #636e72; line-height: 1.6; font-size: 16px;">
              Your application for <strong>${application.companyName}</strong> has been approved! 
              You now have access to the NexCharge Corporate Admin Dashboard.
            </p>
            
            <div style="background-color: #e8f5e8; border-left: 4px solid #00b894; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h3 style="color: #2d3436; margin-top: 0;">🔑 Your Login Credentials</h3>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${user.personalInfo.email}</p>
              <p style="margin: 10px 0;"><strong>Password:</strong> ${password}</p>
              <p style="margin: 10px 0; color: #e74c3c; font-weight: bold;">⚠️ Please change your password after first login for security.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="background: linear-gradient(135deg, #00b894, #00a085); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(0,184,148,0.3);">
                🚀 Access Your Dashboard
              </a>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 25px;">
              <h4 style="color: #2d3436; margin-top: 0;">🎯 What You Can Do Now:</h4>
              <ul style="color: #636e72; line-height: 1.8;">
                <li>Access comprehensive analytics and reporting</li>
                <li>Manage franchise networks and station performance</li>
                <li>Monitor revenue and operational metrics</li>
                <li>Set corporate policies and sustainability goals</li>
                <li>Integrate with government APIs and fleet management systems</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #636e72; font-size: 14px; text-align: center;">
                If you have any questions, please contact our support team at 
                <a href="mailto:support@nexcharge.com" style="color: #00b894;">support@nexcharge.com</a>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #636e72; font-size: 12px;">
            <p>© 2025 NexCharge. All rights reserved.</p>
            <p>Powering the Future of EV Charging</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Approval email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending approval email:', error);
    return false;
  }
};

// Send rejection email
export const sendRejectionEmail = async (application, reviewNotes) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"NexCharge Team" <${process.env.EMAIL_USER}>`,
      to: application.companyEmail,
      subject: '📋 Update on Your Corporate Admin Application',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📋 Application Update</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">NexCharge Corporate Network</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3436; margin-top: 0;">Dear ${application.contactPersonName},</h2>
            
            <p style="color: #636e72; line-height: 1.6; font-size: 16px;">
              Thank you for your interest in joining the NexCharge Corporate Network. 
              After careful review of your application for <strong>${application.companyName}</strong>, 
              we regret to inform you that we are unable to approve your application at this time.
            </p>
            
            ${reviewNotes ? `
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <h3 style="color: #856404; margin-top: 0;">📝 Review Notes</h3>
                <p style="color: #856404; margin: 0; line-height: 1.6;">${reviewNotes}</p>
              </div>
            ` : ''}
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 25px;">
              <h4 style="color: #2d3436; margin-top: 0;">💡 What You Can Do:</h4>
              <ul style="color: #636e72; line-height: 1.8;">
                <li>Review the feedback provided above</li>
                <li>Address any concerns mentioned in the review</li>
                <li>Consider reapplying in the future with updated information</li>
                <li>Contact our team for clarification if needed</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/apply-corporate" 
                 style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(52,152,219,0.3);">
                🔄 Reapply in the Future
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #636e72; font-size: 14px; text-align: center;">
                If you have any questions about this decision, please contact our support team at 
                <a href="mailto:support@nexcharge.com" style="color: #3498db;">support@nexcharge.com</a>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #636e72; font-size: 12px;">
            <p>© 2025 NexCharge. All rights reserved.</p>
            <p>Powering the Future of EV Charging</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return false;
  }
};

// Send application confirmation email
export const sendApplicationConfirmationEmail = async (application) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"NexCharge Team" <${process.env.EMAIL_USER}>`,
      to: application.companyEmail,
      subject: '📋 Corporate Admin Application Received - NexCharge',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #3498db, #2980b9); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📋 Application Received</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">NexCharge Corporate Network</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3436; margin-top: 0;">Thank you, ${application.contactPersonName}!</h2>
            
            <p style="color: #636e72; line-height: 1.6; font-size: 16px;">
              We have successfully received your application to join the NexCharge Corporate Network 
              on behalf of <strong>${application.companyName}</strong>.
            </p>
            
            <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h3 style="color: #1565c0; margin-top: 0;">📋 Application Details</h3>
              <p style="margin: 10px 0;"><strong>Company:</strong> ${application.companyName}</p>
              <p style="margin: 10px 0;"><strong>Contact Person:</strong> ${application.contactPersonName}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${application.companyEmail}</p>
              <p style="margin: 10px 0;"><strong>Application ID:</strong> ${application._id}</p>
              <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold;">Under Review</span></p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 25px;">
              <h4 style="color: #2d3436; margin-top: 0;">⏱️ What Happens Next?</h4>
              <ul style="color: #636e72; line-height: 1.8;">
                <li>Our team will review your application within 3-5 business days</li>
                <li>We may contact you for additional information if needed</li>
                <li>You'll receive an email notification once the review is complete</li>
                <li>If approved, you'll receive login credentials for the Corporate Dashboard</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #636e72; font-size: 14px; text-align: center;">
                If you have any questions, please contact our support team at 
                <a href="mailto:support@nexcharge.com" style="color: #3498db;">support@nexcharge.com</a>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #636e72; font-size: 12px;">
            <p>© 2025 NexCharge. All rights reserved.</p>
            <p>Powering the Future of EV Charging</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Application confirmation email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending application confirmation email:', error);
    return false;
  }
};

// Test email service
export const testEmailService = async () => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"NexCharge Team" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: '🧪 Email Service Test - NexCharge',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #00b894;">✅ Email Service is Working!</h1>
          <p>This is a test email to verify that the NexCharge email service is properly configured.</p>
          <p>If you received this email, congratulations! Your email setup is working correctly.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};

// Welcome email for admin-created corporate admins
export const sendCorporateAdminWelcomeEmail = async ({ companyName, companyEmail, contactPersonName, tempPassword }) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"NexCharge Team" <${process.env.EMAIL_USER || process.env.email_id}>`,
      to: companyEmail,
      subject: 'Welcome to NexCharge Corporate Admin – Your Temporary Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #00b894, #00a085); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="color: #fff; margin: 0;">Welcome, ${contactPersonName}!</h2>
            <p style="color: #eafaf1; margin: 6px 0 0;">${companyName} Corporate Admin Access</p>
          </div>
          <div style="background: #fff; padding: 24px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
            <p>We've created your corporate admin account on NexCharge.</p>
            <p><strong>Email:</strong> ${companyEmail}<br/>
               <strong>Temporary password:</strong> ${tempPassword}</p>
            <p style="color:#e67e22;"><strong>Important:</strong> Please change your password after your first login.</p>
            <div style="text-align:center; margin-top: 16px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background:#00b894;color:#fff;padding:12px 18px;border-radius:24px;text-decoration:none;display:inline-block;">Go to Login</a>
            </div>
          </div>
          <p style="text-align:center;color:#95a5a6;font-size:12px;margin-top:12px;">© 2025 NexCharge</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Corporate admin welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending corporate admin welcome email:', error);
    return false;
  }
};

// Welcome email for corporate-created franchise managers
export const sendFranchiseManagerWelcomeEmail = async ({ managerName, managerEmail, tempPassword }) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"NexCharge Team" <${process.env.EMAIL_USER || process.env.email_id}>`,
      to: managerEmail,
      subject: 'Welcome to NexCharge – Your Franchise Manager Access',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #1976d2, #1565c0); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="color: #fff; margin: 0;">Welcome, ${managerName}!</h2>
            <p style="color: #e3f2fd; margin: 6px 0 0;">Franchise Manager Access</p>
          </div>
          <div style="background: #fff; padding: 24px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
            <p>Your franchise manager account has been created by your corporate administrator.</p>
            <p><strong>Email:</strong> ${managerEmail}<br/>
               <strong>Temporary password:</strong> ${tempPassword}</p>
            <p style="color:#e67e22;"><strong>Important:</strong> You will be asked to change this password on first login.</p>
            <div style="text-align:center; margin-top: 16px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background:#1976d2;color:#fff;padding:12px 18px;border-radius:24px;text-decoration:none;display:inline-block;">Go to Login</a>
            </div>
          </div>
          <p style="text-align:center;color:#95a5a6;font-size:12px;margin-top:12px;">© 2025 NexCharge</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Franchise manager welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending franchise manager welcome email:', error);
    return false;
  }
};

// Welcome email for franchise owners
export const sendFranchiseOwnerWelcomeEmail = async ({ ownerName, ownerEmail, tempPassword, franchiseName }) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"NexCharge Team" <${process.env.EMAIL_USER || process.env.email_id}>`,
      to: ownerEmail,
      subject: 'Welcome to NexCharge Franchise – Your Temporary Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #00b894, #00a085); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="color: #fff; margin: 0;">Welcome, ${ownerName}!</h2>
            <p style="color: #eafaf1; margin: 6px 0 0;">Franchise Owner Access – ${franchiseName}</p>
          </div>
          <div style="background: #fff; padding: 24px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
            <p>We've created your franchise owner account on NexCharge.</p>
            <p><strong>Email:</strong> ${ownerEmail}<br/>
               <strong>Temporary password:</strong> ${tempPassword}</p>
            <p style="color:#e67e22;"><strong>Important:</strong> Please change your password after your first login.</p>
            <div style="text-align:center; margin-top: 16px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background:#00b894;color:#fff;padding:12px 18px;border-radius:24px;text-decoration:none;display:inline-block;">Go to Login</a>
            </div>
          </div>
          <p style="text-align:center;color:#95a5a6;font-size:12px;margin-top:12px;">© 2025 NexCharge</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Franchise owner welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending franchise owner welcome email:', error);
    throw error;
  }
};

export const sendStationManagerWelcomeEmail = async ({ managerName, managerEmail, tempPassword, franchiseName, stationName }) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"NexCharge Team" <${process.env.EMAIL_USER || process.env.email_id}>`,
      to: managerEmail,
      subject: 'Welcome to NexCharge – Your Station Manager Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #00b894, #00a085); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="color: #fff; margin: 0;">Welcome, ${managerName}!</h2>
            <p style="color: #eafaf1; margin: 6px 0 0;">Station Manager Access</p>
          </div>
          <div style="background: #fff; padding: 24px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
            <p>Your station manager account${stationName ? ` for <strong>${stationName}</strong>` : ''} under <strong>${franchiseName || 'NexCharge Franchise'}</strong> has been created.</p>
            <p><strong>Email:</strong> ${managerEmail}<br/>
               <strong>Temporary password:</strong> ${tempPassword}</p>
            <p style="color:#e67e22;"><strong>Important:</strong> You will be asked to change this password on first login for security purposes.</p>
            <div style="text-align:center; margin-top: 16px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background:#00b894;color:#fff;padding:12px 18px;border-radius:24px;text-decoration:none;display:inline-block;">Go to Login</a>
            </div>
          </div>
          <p style="text-align:center;color:#95a5a6;font-size:12px;margin-top:12px;">© 2025 NexCharge</p>
        </div>
      `
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Station manager welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending station manager welcome email:', error);
    throw error;
  }
};

// Password reset OTP email (6-digit)
export const sendPasswordResetOtpEmail = async ({ recipientEmail, recipientName, otpCode }) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"NexCharge Team" <${process.env.EMAIL_USER || process.env.email_id}>`,
      to: recipientEmail,
      subject: 'NexCharge Password Reset – Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #00b894, #00a085); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="color: #fff; margin: 0;">Password Reset Request</h2>
            <p style="color: #eafaf1; margin: 6px 0 0;">Secure OTP Verification</p>
          </div>
          <div style="background: #fff; padding: 24px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
            <p>Hi ${recipientName || 'there'},</p>
            <p>We received a request to reset the password for your NexCharge account.</p>
            <p style="margin: 16px 0;">Please use the following One-Time Password (OTP) to proceed:</p>
            <div style="text-align: center; margin: 20px 0;">
              <div style="display: inline-block; background: #f1fff8; border: 2px dashed #00b894; color: #00a085; font-weight: bold; font-size: 28px; letter-spacing: 4px; padding: 12px 24px; border-radius: 10px;">
                ${otpCode}
              </div>
            </div>
            <p style="color:#e67e22;"><strong>Note:</strong> This code will expire in 10 minutes. Do not share it with anyone.</p>
            <p>If you didn’t request this, you can safely ignore this email.</p>
            <div style="text-align:center; margin-top: 16px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/forgot-password" style="background:#00b894;color:#fff;padding:12px 18px;border-radius:24px;text-decoration:none;display:inline-block;">Enter OTP</a>
            </div>
          </div>
          <p style="text-align:center;color:#95a5a6;font-size:12px;margin-top:12px;">© 2025 NexCharge</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset OTP email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset OTP email:', error);
    return false;
  }
};

// Booking confirmation email
export const sendBookingConfirmationEmail = async (booking, user, station) => {
  try {
    const transporter = await createTransporter();
    
    // Format dates for display
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const formattedStartTime = startTime.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const formattedEndTime = endTime.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const duration = Math.round((endTime - startTime) / (1000 * 60)); // minutes
    const estimatedCost = booking.pricing?.estimatedCost || 0;

    const mailOptions = {
      from: `"NexCharge Team" <${process.env.EMAIL_USER || process.env.email_id}>`,
      to: user.personalInfo.email,
      subject: '✅ Booking Confirmed - Your Charging Session is Set!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #00b894, #00a085); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your EV Charging Session is Ready</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3436; margin-top: 0;">Hello ${user.personalInfo.firstName} ${user.personalInfo.lastName}!</h2>
            
            <p style="color: #636e72; line-height: 1.6; font-size: 16px;">
              Your booking at <strong>${station.name}</strong> has been successfully confirmed.
            </p>
            
            <div style="background-color: #e8f5e8; border-left: 4px solid #00b894; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h3 style="color: #2d3436; margin-top: 0;">📅 Booking Details</h3>
              <p style="margin: 10px 0;"><strong>Station:</strong> ${station.name}</p>
              <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
              <p style="margin: 10px 0;"><strong>Duration:</strong> ${duration} minutes</p>
              <p style="margin: 10px 0;"><strong>Charger Type:</strong> ${booking.chargerType}</p>
              <p style="margin: 10px 0;"><strong>Estimated Cost:</strong> ₹${estimatedCost.toFixed(2)}</p>
              <p style="margin: 10px 0;"><strong>Booking ID:</strong> ${booking._id}</p>
            </div>
            
            <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h3 style="color: #2d3436; margin-top: 0;">💡 Important Information</h3>
              <ul style="color: #636e72; line-height: 1.8; padding-left: 20px;">
                <li>Please arrive at the station at least 5 minutes before your scheduled time</li>
                <li>Bring your EV and charging cable</li>
                <li>Your booking will be automatically cancelled if you don't start charging within 15 minutes of the scheduled start time</li>
                <li>You'll receive a reminder notification 5 minutes before your session starts</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings" 
                 style="background: linear-gradient(135deg, #00b894, #00a085); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(0,184,148,0.3);">
                📋 View Your Booking
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #636e72; font-size: 14px; text-align: center;">
                Need help? Contact our support team at 
                <a href="mailto:support@nexcharge.com" style="color: #00b894;">support@nexcharge.com</a>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #636e72; font-size: 12px;">
            <p>© 2025 NexCharge. All rights reserved.</p>
            <p>Powering the Future of EV Charging</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return false;
  }
};

// Send OTP email for charging verification
export const sendOTPEmail = async (booking, user, station, otpCode) => {
  try {
    const transporter = await createTransporter();
    
    // Format dates for display
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const formattedStartTime = startTime.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const formattedEndTime = endTime.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: `"NexCharge Team" <${process.env.EMAIL_USER || process.env.email_id}>`,
      to: user.personalInfo.email,
      subject: '🔐 Your Charging OTP - Start Your Session',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #00b894, #00a085); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Charging OTP</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your 6-digit verification code</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3436; margin-top: 0;">Hello ${user.personalInfo.firstName} ${user.personalInfo.lastName}!</h2>
            
            <p style="color: #636e72; line-height: 1.6; font-size: 16px;">
              Your charging session at <strong>${station.name}</strong> is ready to start.
            </p>
            
            <div style="background-color: #e8f5e8; border-left: 4px solid #00b894; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h3 style="color: #2d3436; margin-top: 0;">📅 Session Details</h3>
              <p style="margin: 10px 0;"><strong>Station:</strong> ${station.name}</p>
              <p style="margin: 10px 0;"><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
              <p style="margin: 10px 0;"><strong>Charger Type:</strong> ${booking.chargerType}</p>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h3 style="color: #2d3436; margin-top: 0;">🔐 Your OTP Code</h3>
              <div style="text-align: center; margin: 20px 0;">
                <div style="display: inline-block; background: #f1fff8; border: 3px solid #00b894; color: #00a085; font-weight: bold; font-size: 32px; letter-spacing: 6px; padding: 20px 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,184,148,0.2);">
                  ${otpCode}
                </div>
              </div>
              <p style="color: #e67e22; font-weight: bold; text-align: center; margin: 15px 0 0 0;">
                ⏰ This code expires in 10 minutes
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 25px;">
              <h4 style="color: #2d3436; margin-top: 0;">🚗 How to Start Charging:</h4>
              <ol style="color: #636e72; line-height: 1.8; padding-left: 20px;">
                <li>Go to your booking in the NexCharge app</li>
                <li>Enter the 6-digit OTP code above</li>
                <li>Tap "Start Charging" to begin your session</li>
                <li>Use "Stop Charging" when you're done</li>
              </ol>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #636e72; font-size: 14px; text-align: center;">
                Need help? Contact our support team at 
                <a href="mailto:support@nexcharge.com" style="color: #00b894;">support@nexcharge.com</a>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #636e72; font-size: 12px;">
            <p>© 2025 NexCharge. All rights reserved.</p>
            <p>Powering the Future of EV Charging</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};
