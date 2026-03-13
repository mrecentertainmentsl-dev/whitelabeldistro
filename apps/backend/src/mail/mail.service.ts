import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private sesClient: SESClient;
  private fromEmail: string;
  private fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.sesClient = new SESClient({
      region: this.configService.get('AWS_SES_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
    this.fromEmail = this.configService.get('AWS_SES_FROM_EMAIL', 'noreply@mrec.io');
    this.fromName = this.configService.get('AWS_SES_FROM_NAME', 'MREC Entertainment');
  }

  private async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    const command = new SendEmailCommand({
      Source: `${this.fromName} <${this.fromEmail}>`,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: template.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: template.html, Charset: 'UTF-8' },
          Text: { Data: template.text, Charset: 'UTF-8' },
        },
      },
    });

    try {
      await this.sesClient.send(command);
      this.logger.log(`Email sent to ${to}: ${template.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      // Don't throw — email failures shouldn't break the app flow
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    const template: EmailTemplate = {
      subject: `Verify your ${this.fromName} account`,
      html: this.buildEmailHtml({
        title: 'Verify Your Email',
        greeting: `Hi ${name || 'there'},`,
        body: `Thank you for registering with ${this.fromName}. Please click the button below to verify your email address.`,
        ctaText: 'Verify Email',
        ctaUrl: verifyUrl,
        footer: `This link expires in 24 hours. If you didn't create an account, please ignore this email.`,
      }),
      text: `Verify your email: ${verifyUrl}`,
    };

    await this.sendEmail(email, template);
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    const template: EmailTemplate = {
      subject: `Reset your ${this.fromName} password`,
      html: this.buildEmailHtml({
        title: 'Reset Your Password',
        greeting: `Hi ${name || 'there'},`,
        body: `We received a request to reset your password. Click the button below to set a new password.`,
        ctaText: 'Reset Password',
        ctaUrl: resetUrl,
        footer: `This link expires in 1 hour. If you didn't request a password reset, please ignore this email.`,
      }),
      text: `Reset your password: ${resetUrl}`,
    };

    await this.sendEmail(email, template);
  }

  async sendReleaseStatusEmail(
    email: string,
    name: string,
    releaseTitle: string,
    status: 'approved' | 'rejected',
    reason?: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');

    const template: EmailTemplate = {
      subject: `Your release "${releaseTitle}" has been ${status}`,
      html: this.buildEmailHtml({
        title: status === 'approved' ? '🎉 Release Approved!' : '❌ Release Rejected',
        greeting: `Hi ${name || 'there'},`,
        body: status === 'approved'
          ? `Great news! Your release <strong>"${releaseTitle}"</strong> has been approved and is now being distributed to all selected platforms.`
          : `Your release <strong>"${releaseTitle}"</strong> has been rejected.${reason ? `<br><br><strong>Reason:</strong> ${reason}` : ''} Please review the feedback and resubmit.`,
        ctaText: 'View Release',
        ctaUrl: `${frontendUrl}/dashboard/releases`,
        footer: `If you have any questions, please contact our support team.`,
      }),
      text: `Your release "${releaseTitle}" has been ${status}.${reason ? ` Reason: ${reason}` : ''}`,
    };

    await this.sendEmail(email, template);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const template: EmailTemplate = {
      subject: `Welcome to ${this.fromName}!`,
      html: this.buildEmailHtml({
        title: `Welcome to ${this.fromName}!`,
        greeting: `Hi ${name || 'there'},`,
        body: `Your account has been verified and you're ready to start distributing your music globally. Upload your first release and reach millions of listeners on Spotify, Apple Music, and more.`,
        ctaText: 'Start Distributing',
        ctaUrl: `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/dashboard/upload`,
        footer: `Thank you for choosing ${this.fromName} as your distribution partner.`,
      }),
      text: `Welcome to ${this.fromName}! Your account is ready.`,
    };

    await this.sendEmail(email, template);
  }

  private buildEmailHtml(params: {
    title: string;
    greeting: string;
    body: string;
    ctaText: string;
    ctaUrl: string;
    footer: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f0f0f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" align="center" style="background:#1a1a2e;border-radius:12px;overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7C3AED,#A855F7);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">${this.fromName}</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Music Distribution Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="color:#fff;font-size:22px;margin:0 0 16px;font-weight:700;">${params.title}</h2>
              <p style="color:#d1d5db;margin:0 0 12px;font-size:15px;">${params.greeting}</p>
              <p style="color:#d1d5db;margin:0 0 28px;font-size:15px;line-height:1.6;">${params.body}</p>
              <a href="${params.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">${params.ctaText}</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #2d2d4e;">
              <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.5;">${params.footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
