import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailApprovalService {
  private readonly logger = new Logger(EmailApprovalService.name);

  async sendApprovalEmail(recipientEmail: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const PORT = process.env.PORT;
    const approvalUrl = `http://localhost:${PORT}/email-approval/action?type=approve`;
    const rejectUrl = `http://localhost:${PORT}/email-approval/action?type=reject`;

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

    this.logger.log(`Approval email sent to ${recipientEmail}`);
  }
}
