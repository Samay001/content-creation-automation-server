import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { EmailApprovalService } from './email.service';

@Controller('email-approval')
export class EmailApprovalController {
  constructor(private readonly emailService: EmailApprovalService) {}

  // Send email
  @Get('send')
  async sendEmail(@Query('to') to: string) {
    await this.emailService.sendApprovalEmail(to || process.env.MAIL_USER);
    return { message: 'Approval email sent successfully!' };
  }

  // Step 1: Initial page with popup confirmation
  @Get('action')
  async showConfirmation(
    @Query('type') type: 'approve' | 'reject',
    @Res() res: Response,
  ) {
    const actionLabel = type === 'approve' ? 'Approve' : 'Reject';
    const color = type === 'approve' ? '#4CAF50' : '#f44336';

    const html = `
      <html>
        <head>
          <title>${actionLabel} Confirmation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding-top: 100px;
            }
            button {
              background-color: ${color};
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            }
            button:hover {
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <h2>${actionLabel} Request</h2>
          <p>Are you sure you want to <b>${actionLabel.toLowerCase()}</b> this request?</p>
          <button onclick="confirmAction()">Confirm ${actionLabel}</button>

          <script>
            function confirmAction() {
              if (confirm('Are you sure you want to ${actionLabel.toLowerCase()} this request?')) {
                window.location.href = '/email-approval/confirm?action=${type}';
              } else {
                alert('Action cancelled.');
              }
            }
          </script>
        </body>
      </html>
    `;

    res.send(html);
  }

  // Step 2: Final confirmation route
  @Get('confirm')
  async finalizeAction(@Query('action') action: 'approve' | 'reject') {
    if (action === 'approve') {
      console.log('✅ Email Approved');
      return `<h2 style="color: green; text-align: center; margin-top: 100px;">✅ Request Approved Successfully!</h2>`;
    } else if (action === 'reject') {
      console.log('❌ Email Rejected');
      return `<h2 style="color: red; text-align: center; margin-top: 100px;">❌ Request Rejected!</h2>`;
    } else {
      return `<h2 style="text-align: center; margin-top: 100px;">Invalid action.</h2>`;
    }
  }
}
