# Email Setup for NexCharge Backend

This document explains how to configure email functionality for sending corporate admin application approval/rejection emails.

## Required Environment Variables

Add these variables to your `backend/.env` file:

### Gmail Configuration (Recommended)
```env
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password
FRONTEND_URL=http://localhost:3000
```

### Alternative SMTP Configuration
If you prefer to use other email providers:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
FRONTEND_URL=http://localhost:3000
```

## Gmail App Password Setup

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "NexCharge" as the name
   - Copy the generated 16-character password
3. **Use the App Password** in your `.env` file (not your regular Gmail password)

## Email Functionality

The system now sends emails for:

### 1. Application Confirmation
- Sent when a corporate application is submitted
- Confirms receipt and explains next steps

### 2. Application Approval
- Sent when an application is approved
- Includes login credentials (email + generated password)
- Provides dashboard access link

### 3. Application Rejection
- Sent when an application is rejected
- Includes review notes and feedback
- Provides reapplication guidance

## Testing Email Service

1. **Start the backend server**
2. **Login as admin** in the frontend
3. **Test email service** by making a POST request to:
   ```
   POST /api/corporate-applications/test-email
   Authorization: Bearer <your-admin-jwt-token>
   ```

## Troubleshooting

### Common Issues:

1. **"Invalid login" error**:
   - Check if 2FA is enabled on Gmail
   - Verify you're using App Password, not regular password

2. **"Authentication failed"**:
   - Ensure EMAIL_USER and EMAIL_APP_PASSWORD are correct
   - Check if Gmail account has "Less secure app access" enabled (not recommended)

3. **Emails not sending**:
   - Check server console for error logs
   - Verify all environment variables are set
   - Test with the test email endpoint

### Security Notes:

- Never commit `.env` files to version control
- Use App Passwords instead of regular passwords
- Regularly rotate App Passwords
- Consider using environment-specific `.env` files

## Email Templates

The system uses HTML email templates with:
- NexCharge branding and colors
- Responsive design
- Clear call-to-action buttons
- Professional formatting

Templates are located in `src/utils/emailService.js` and can be customized as needed.

