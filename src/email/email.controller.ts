import { Controller, Get, Query, Res, Post, Body } from '@nestjs/common';
import { Response } from 'express';
import { EmailApprovalService } from './email.service';
import { WorkflowService } from '../workflow/workflow.service';

export class SendContentEmailDto {
  recipientEmail: string;
  videoUrl: string;
  caption: string;
  hashtags: string[];
}

@Controller('email-approval')
export class EmailApprovalController {
  constructor(
    private readonly emailService: EmailApprovalService,
    private readonly workflowService: WorkflowService
  ) {}

  // Send approval email
  @Get('send')
  async sendEmail(@Query('to') to: string) {
    await this.emailService.sendApprovalEmail(to || process.env.MAIL_USER);
    return { message: 'Approval email sent successfully!' };
  }

  // Send content delivery email
  @Post('send-content')
  async sendContentEmail(@Body() sendContentDto: SendContentEmailDto) {
    await this.emailService.sendContentDeliveryEmail(
      sendContentDto.recipientEmail,
      sendContentDto.videoUrl,
      sendContentDto.caption,
      sendContentDto.hashtags
    );
    return { 
      message: 'Content delivery email sent successfully!',
      recipientEmail: sendContentDto.recipientEmail,
      sentAt: new Date().toISOString()
    };
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

  // Simple approval/rejection handler
  @Get('content-action')
  async handleContentAction(
    @Query('action') action: 'approve' | 'reject',
    @Query('contentId') contentId: string,
    @Res() res: Response,
    @Query('videoUrl') videoUrl?: string,
    @Query('caption') caption?: string,
    @Query('hashtags') hashtags?: string
  ) {
    if (action === 'reject') {
      console.log(`❌ Content rejected: ${contentId}`);
      const html = `
        <html>
          <head>
            <title>Content Rejected</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .container { max-width: 500px; margin: 0 auto; }
              .rejected { color: #dc3545; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="rejected">❌ Content Rejected</h2>
              <p>The content has been rejected and will not be processed further.</p>
              <p><small>Content ID: ${contentId}</small></p>
              <p><small>Rejected at: ${new Date().toLocaleString()}</small></p>
            </div>
          </body>
        </html>
      `;
      res.send(html);
      return;
    }

    if (action === 'approve') {
      console.log(`✅ Content approved: ${contentId}`);
      
      // Trigger Instagram upload when content is approved
      let instagramResult = null;
      if (videoUrl && caption) {
        try {
          const decodedCaption = decodeURIComponent(caption);
          const fullCaption = hashtags ? `${decodedCaption}\n\n${decodeURIComponent(hashtags)}` : decodedCaption;
          
          console.log(`🎬 Starting Instagram upload for approved content...`);
          instagramResult = await this.workflowService.handleEmailApprovalWithInstagram(
            videoUrl, 
            decodedCaption, 
            hashtags ? [decodeURIComponent(hashtags)] : []
          );
          
          if (instagramResult.success) {
            console.log(`✅ Instagram container created: ${instagramResult.containerId}`);
          } else {
            console.error(`❌ Instagram upload failed: ${instagramResult.message}`);
          }
        } catch (error) {
          console.error(`❌ Error during Instagram upload:`, error);
          instagramResult = {
            success: false,
            message: `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
      
      const approvedHtml = `
        <html>
          <head>
            <title>Content Approved</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .container { max-width: 600px; margin: 0 auto; }
              .approved { color: #28a745; }
              .instagram-status { margin: 20px 0; padding: 15px; border-radius: 8px; }
              .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
              .error { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="approved">✅ Content Approved</h2>
              <p>The content has been approved successfully!</p>
              
              ${instagramResult ? `
                <div class="instagram-status ${instagramResult.success ? 'success' : 'error'}">
                  <h4>📱 Instagram Upload Status:</h4>
                  <p>${instagramResult.success ? '✅' : '❌'} ${instagramResult.message}</p>
                  ${instagramResult.containerId ? `<p><small>Container ID: ${instagramResult.containerId}</small></p>` : ''}
                </div>
              ` : ''}
              
              <hr style="margin: 30px 0;">
              <div style="text-align: left; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h4>📝 Content Details:</h4>
                <p><strong>Video:</strong> ${videoUrl || 'N/A'}</p>
                <p><strong>Caption:</strong> ${caption ? decodeURIComponent(caption) : 'N/A'}</p>
                <p><strong>Hashtags:</strong> ${hashtags ? decodeURIComponent(hashtags) : 'N/A'}</p>
              </div>
              <p><small>Content ID: ${contentId}</small></p>
              <p><small>Approved at: ${new Date().toLocaleString()}</small></p>
            </div>
          </body>
        </html>
      `;
      res.send(approvedHtml);
      return;
    }

    res.status(400).send('<h2 style="text-align: center; margin-top: 100px;">❌ Invalid action.</h2>');
  }

  // Step 2: Final confirmation route (legacy)
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

  // Check Instagram container status
  @Get('instagram-status')
  async getInstagramStatus(@Query('containerId') containerId?: string) {
    if (containerId) {
      const status = this.workflowService.getInstagramContainerStatus(containerId);
      return {
        containerId,
        status: status || 'Container not found'
      };
    } else {
      const allContainers = this.workflowService.getAllInstagramContainers();
      return {
        containers: allContainers,
        count: allContainers.length
      };
    }
  }
}
