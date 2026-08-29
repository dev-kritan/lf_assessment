"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
class EmailService {
    static transporter = null;
    static lastSentEmail = null; // For test assertions & inspection
    static getTransporter() {
        if (this.transporter) {
            return this.transporter;
        }
        if (env_1.config.isTest || !env_1.config.smtp.host) {
            // In test mode or when SMTP is not configured, create a stream/JSON transport that doesn't attempt external network calls
            this.transporter = nodemailer_1.default.createTransport({
                jsonTransport: true,
            });
            return this.transporter;
        }
        this.transporter = nodemailer_1.default.createTransport({
            host: env_1.config.smtp.host,
            port: env_1.config.smtp.port,
            secure: env_1.config.smtp.secure,
            auth: env_1.config.smtp.user
                ? {
                    user: env_1.config.smtp.user,
                    pass: env_1.config.smtp.pass,
                }
                : undefined,
        });
        return this.transporter;
    }
    static async sendVerificationEmail(options) {
        const transporter = this.getTransporter();
        const appName = env_1.config.appName || 'EventHub';
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email Address</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 36px 32px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 36px 32px;
    }
    .content h2 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    .info-box {
      background-color: #f1f5f9;
      border-left: 4px solid #4f46e5;
      padding: 14px 18px;
      border-radius: 0 10px 10px 0;
      font-size: 13px;
      color: #475569;
      margin: 24px 0;
    }
    .fallback-link {
      font-size: 12px;
      color: #64748b;
      word-break: break-all;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${appName}</h1>
    </div>
    <div class="content">
      <h2>Welcome, ${options.name}! 👋</h2>
      <p>Thank you for signing up for ${appName}. To activate your account and start planning or attending events, please verify your email address by clicking the button below:</p>
      
      <div class="button-container">
        <a href="${options.verificationUrl}" class="button" target="_blank">Verify Email Address</a>
      </div>

      <div class="info-box">
        ⏳ <strong>Note:</strong> This verification link will expire in <strong>24 hours</strong>. If you did not create an account with ${appName}, you can safely ignore this email.
      </div>

      <p class="fallback-link">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${options.verificationUrl}" style="color: #4f46e5;">${options.verificationUrl}</a>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;
        const mailOptions = {
            from: env_1.config.smtp.from,
            to: options.to,
            subject: `Verify your email address - ${appName}`,
            text: `Hello ${options.name},\n\nPlease verify your email address by visiting this link:\n${options.verificationUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe ${appName} Team`,
            html: htmlContent,
        };
        try {
            const info = await transporter.sendMail(mailOptions);
            this.lastSentEmail = {
                to: options.to,
                subject: mailOptions.subject,
                verificationUrl: options.verificationUrl,
                info,
            };
            return { messageId: info.messageId };
        }
        catch (err) {
            console.error('[EmailService] Failed to send email:', err);
            // Store in lastSentEmail even on error for fallback testing
            this.lastSentEmail = {
                to: options.to,
                subject: mailOptions.subject,
                verificationUrl: options.verificationUrl,
                error: err,
            };
            return {};
        }
    }
}
exports.EmailService = EmailService;
