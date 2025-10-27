import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailApprovalService {
  private readonly logger = new Logger(EmailApprovalService.name);

  private createTransporter() {
    return nodemailer.createTransporter({
      service: 'gmail', 
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      // Add timeout and connection settings for Render deployment
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5,
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds  
      socketTimeout: 60000,     // 60 seconds
    });
  }

  async sendApprovalEmail(recipientEmail: string): Promise<void> {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`📧 Attempt ${attempt}/${maxRetries}: Sending approval email to ${recipientEmail}`);
        
        const transporter = this.createTransporter();
        const approvalUrl = `${process.env.BASE_DEPLOYED_URL}/email-approval/action?type=approve`;
        const rejectUrl = `${process.env.BASE_DEPLOYED_URL}/email-approval/action?type=reject`;

        const htmlContent = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Email Approval Request</h2>
            <p>Hey Samay 👋, someone has requested approval.</p>
            <p>Please choose one of the options below:</p>
            <div style="margin-top: 20px;">
              <a href="${approvalUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Approve</a>
              <a href="${rejectUrl}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-left: 10px;">Reject</a>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"Approval Bot" <${process.env.MAIL_USER}>`,
          to: recipientEmail,
          subject: 'Content Approval Request',
          html: htmlContent,
        });

        this.logger.log(`✅ Approval email sent successfully to ${recipientEmail} on attempt ${attempt}`);
        return; // Success, exit retry loop
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`⚠️ Approval email attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          const waitTime = attempt * 2000; // Progressive backoff: 2s, 4s, 6s
          this.logger.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // If all retries failed, throw the last error
    this.logger.error(`❌ All ${maxRetries} approval email attempts failed. Last error: ${lastError.message}`);
    throw new Error(`Approval email delivery failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  async sendContentDeliveryEmail(
    recipientEmail: string, 
    videoUrl: string, 
    caption: string, 
    hashtags: string[],
  ): Promise<void> {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`📧 Attempt ${attempt}/${maxRetries}: Sending email to ${recipientEmail}`);
        
        const transporter = this.createTransporter();
        const hashtagsString = hashtags.join(' ');
        const PORT = process.env.PORT || 8080;
        
        //  approval and reject URLs with content dataCreate
        const approveUrl = `${process.env.BASE_DEPLOYED_URL}/email-approval/content-action?action=approve&videoUrl=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption)}&hashtags=${encodeURIComponent(hashtagsString)}`;
        const rejectUrl = `${process.env.BASE_DEPLOYED_URL}/email-approval/content-action?action=reject`;

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">🎬 Your Content is Ready!</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">📹 Video</h3>
              <p><strong>Video URL:</strong></p>
              <a href="${videoUrl}" style="color: #007bff; word-break: break-all;">${videoUrl}</a>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">📝 Caption</h3>
              <p style="font-style: italic; line-height: 1.6;">"${caption}"</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">🏷️ Hashtags</h3>
              <p style="color: #6c757d; word-break: break-word;">${hashtagsString}</p>
            </div>

            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin-top: 0;">📋 Content Approval</h4>
              <p style="color: #856404; margin-bottom: 15px;">
                Please review the content above and choose to approve or reject it.
              </p>
              <div style="text-align: center;">
                <a href="${approveUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px; display: inline-block; font-weight: bold;">
                  ✅ Approve Content
                </a>
                <a href="${rejectUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  ❌ Reject Content
                </a>
              </div>
            </div>

            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h4 style="color: #155724; margin-top: 0;">📋 Ready for Use</h4>
              <p style="color: #155724; margin-bottom: 0;">
                Once approved, you can download the video and use the caption and hashtags for your social media posts.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
          </div>
        `;

        await transporter.sendMail({
          from: `"Content Creator Bot" <${process.env.MAIL_USER}>`,
          to: recipientEmail,
          subject: '🎬 Your Automated Content is Ready!',
          html: htmlContent,
        });

        this.logger.log(`✅ Content delivery email sent successfully to ${recipientEmail} on attempt ${attempt}`);
        return; // Success, exit retry loop
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`⚠️ Email attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          const waitTime = attempt * 2000; // Progressive backoff: 2s, 4s, 6s
          this.logger.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // If all retries failed, throw the last error
    this.logger.error(`❌ All ${maxRetries} email attempts failed. Last error: ${lastError.message}`);
    throw new Error(`Email delivery failed after ${maxRetries} attempts: ${lastError.message}`);
  }
}
