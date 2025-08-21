import { storage } from "../storage";
import { openaiService } from "./openai";
import type { 
  Subscriber, 
  InsertEmailCampaign, 
  Product, 
  Coupon,
  User 
} from "@shared/schema";

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface PersonalizedEmail {
  subscriber: Subscriber;
  deals: Array<{
    product: Product;
    coupon?: Coupon;
    trackingUrl: string;
  }>;
  template: EmailTemplate;
}

export class EmailService {
  private resendApiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;

  // Send daily personalized deals email
  async sendDailyDealsEmail(): Promise<{ sent: number; failed: number; errors: string[] }> {
    try {
      const subscribers = await storage.getSubscribers();
      const featuredProducts = await storage.getFeaturedProducts(20);
      const activeCoupons = await storage.getActiveCoupons();
      
      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const subscriber of subscribers.slice(0, 100)) { // Limit for demo
        try {
          const personalizedEmail = await this.generatePersonalizedEmail(
            subscriber,
            featuredProducts,
            activeCoupons
          );
          
          await this.sendEmail(personalizedEmail);
          sent++;
          
          // Update last email sent timestamp
          await storage.updateSubscriber(subscriber.id, {
            lastEmailSent: new Date()
          });
          
        } catch (error) {
          failed++;
          errors.push(`Failed to send to ${subscriber.email}: ${error.message}`);
        }
      }

      // Log campaign
      await storage.createEmailCampaign({
        name: `Daily Deals - ${new Date().toISOString().split('T')[0]}`,
        subject: 'Your Daily Personalized Deals',
        templateType: 'daily_deals',
        content: { type: 'daily_deals', automated: true },
        status: 'sent',
        sentAt: new Date(),
        recipientCount: sent
      });

      return { sent, failed, errors };
    } catch (error) {
      console.error('Error sending daily deals email:', error);
      throw error;
    }
  }

  // Generate personalized email content for a subscriber
  private async generatePersonalizedEmail(
    subscriber: Subscriber,
    allProducts: Product[],
    allCoupons: Coupon[]
  ): Promise<PersonalizedEmail> {
    try {
      // Get subscriber preferences
      const preferences = subscriber.preferences as any || {};
      const userCategories = preferences.categories || ['Electronics', 'Fashion'];
      
      // Filter products based on preferences
      const relevantProducts = allProducts
        .filter(product => {
          // In real implementation, filter by actual product categories
          return Math.random() > 0.5; // Random selection for demo
        })
        .slice(0, 5);

      // Find relevant coupons
      const relevantCoupons = allCoupons
        .filter(coupon => {
          return relevantProducts.some(product => 
            product.merchantId === coupon.merchantId || 
            product.id === coupon.productId
          );
        });

      // Generate AI-powered email content
      const emailContent = await openaiService.generateEmailContent(
        userCategories,
        relevantProducts.map(p => ({
          name: p.name,
          originalPrice: parseFloat(p.originalPrice || '0'),
          salePrice: parseFloat(p.salePrice || '0'),
          merchant: 'Merchant' // In real implementation, join with merchants table
        })),
        'daily'
      );

      // Generate HTML template
      const htmlContent = this.generateEmailHTML(emailContent, relevantProducts, relevantCoupons);
      const textContent = this.generateEmailText(emailContent, relevantProducts);

      return {
        subscriber,
        deals: relevantProducts.map(product => ({
          product,
          coupon: relevantCoupons.find(c => 
            c.merchantId === product.merchantId || c.productId === product.id
          ),
          trackingUrl: this.generateTrackingUrl(product.affiliateUrl || product.productUrl || '', subscriber.id)
        })),
        template: {
          subject: emailContent.subject,
          htmlContent,
          textContent
        }
      };
    } catch (error) {
      console.error('Error generating personalized email:', error);
      throw error;
    }
  }

  // Generate HTML email template
  private generateEmailHTML(emailContent: any, products: Product[], coupons: Coupon[]): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Daily Deals</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #0B0F1A; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0B0F1A 0%, #1A1B3A 100%); }
        .header { padding: 30px 20px; text-align: center; background: linear-gradient(135deg, rgba(56, 248, 179, 0.1) 0%, rgba(124, 77, 255, 0.1) 100%); }
        .logo { font-size: 24px; font-weight: bold; color: #38F8B3; margin-bottom: 10px; }
        .content { padding: 20px; }
        .deal-card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; margin: 20px 0; padding: 20px; }
        .deal-image { width: 100%; height: 200px; background: #1A1B3A; border-radius: 8px; margin-bottom: 15px; }
        .deal-title { font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 10px; }
        .deal-price { font-size: 16px; color: #38F8B3; font-weight: bold; }
        .deal-original-price { text-decoration: line-through; color: #888; margin-left: 10px; }
        .coupon-code { background: rgba(56, 248, 179, 0.2); color: #38F8B3; padding: 8px 16px; border-radius: 6px; font-family: monospace; margin: 10px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #38F8B3 0%, #7C4DFF 100%); color: #0B0F1A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 15px 0; }
        .footer { padding: 20px; text-align: center; color: #888; font-size: 14px; }
        .unsubscribe { color: #38F8B3; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">FairDealHub</div>
            <h1 style="margin: 0; color: #ffffff;">${emailContent.subject}</h1>
            <p style="color: #ccc; margin: 10px 0 0 0;">${emailContent.content.greeting}</p>
        </div>
        
        <div class="content">
            <p style="color: #ffffff; line-height: 1.6;">${emailContent.content.mainContent}</p>
            
            ${products.map(product => `
                <div class="deal-card">
                    <div class="deal-image"></div>
                    <div class="deal-title">${product.name}</div>
                    <div class="deal-description" style="color: #ccc; margin-bottom: 15px;">${product.description || ''}</div>
                    <div class="deal-price">
                        $${product.salePrice}
                        ${product.originalPrice ? `<span class="deal-original-price">$${product.originalPrice}</span>` : ''}
                    </div>
                    ${coupons.find(c => c.productId === product.id || c.merchantId === product.merchantId) ? 
                        `<div class="coupon-code">Code: ${coupons.find(c => c.productId === product.id || c.merchantId === product.merchantId)?.code}</div>` : ''
                    }
                    <a href="${this.generateTrackingUrl(product.affiliateUrl || product.productUrl || '', 'email')}" class="cta-button">Get This Deal</a>
                </div>
            `).join('')}
            
            <p style="color: #ffffff; line-height: 1.6; margin-top: 30px;">${emailContent.content.closingMessage}</p>
        </div>
        
        <div class="footer">
            <p>© 2024 FairDealHub. All rights reserved.</p>
            <p><a href="{{unsubscribe_url}}" class="unsubscribe">Unsubscribe</a> | <a href="https://fairdealhub.com" class="unsubscribe">Visit Website</a></p>
        </div>
    </div>
</body>
</html>`;
  }

  // Generate text email template
  private generateEmailText(emailContent: any, products: Product[]): string {
    return `
${emailContent.subject}

${emailContent.content.greeting}

${emailContent.content.mainContent}

Your Personalized Deals:

${products.map(product => `
• ${product.name}
  ${product.description || ''}
  Price: $${product.salePrice}${product.originalPrice ? ` (was $${product.originalPrice})` : ''}
  Link: ${product.affiliateUrl || product.productUrl || ''}
`).join('\n')}

${emailContent.content.closingMessage}

---
© 2024 FairDealHub. All rights reserved.
Unsubscribe: {{unsubscribe_url}}
`;
  }

  // Send email using Resend or configured email service
  private async sendEmail(personalizedEmail: PersonalizedEmail): Promise<void> {
    try {
      // Replace with actual email service implementation
      if (this.resendApiKey) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'deals@fairdealhub.com',
            to: personalizedEmail.subscriber.email,
            subject: personalizedEmail.template.subject,
            html: personalizedEmail.template.htmlContent,
            text: personalizedEmail.template.textContent
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Email send failed: ${error}`);
        }
      } else {
        // Log email for development
        console.log(`📧 Email sent to: ${personalizedEmail.subscriber.email}`);
        console.log(`Subject: ${personalizedEmail.template.subject}`);
        console.log(`Deals included: ${personalizedEmail.deals.length}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Generate tracking URL for email links
  private generateTrackingUrl(originalUrl: string, subscriberId: string): string {
    const trackingParams = new URLSearchParams({
      source: 'email',
      subscriber_id: subscriberId,
      utm_source: 'fairdealhub_email',
      utm_medium: 'email',
      utm_campaign: 'daily_deals'
    });

    return `${originalUrl}?${trackingParams.toString()}`;
  }

  // Send welcome email series
  async sendWelcomeEmail(subscriberId: string): Promise<void> {
    try {
      const subscriber = await storage.getSubscriber(subscriberId);
      if (!subscriber) {
        throw new Error('Subscriber not found');
      }

      const welcomeContent = await openaiService.generateEmailContent(
        [],
        [],
        'welcome'
      );

      const htmlContent = this.generateWelcomeHTML(welcomeContent);
      const textContent = this.generateWelcomeText(welcomeContent);

      await this.sendEmail({
        subscriber,
        deals: [],
        template: {
          subject: welcomeContent.subject,
          htmlContent,
          textContent
        }
      });

      console.log(`Welcome email sent to: ${subscriber.email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  private generateWelcomeHTML(content: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to FairDealHub</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #0B0F1A; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 32px; font-weight: bold; color: #38F8B3; }
        .content { line-height: 1.6; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #38F8B3 0%, #7C4DFF 100%); color: #0B0F1A; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Welcome to FairDealHub!</div>
        </div>
        <div class="content">
            <h2>🎉 You're all set for amazing deals!</h2>
            <p>Welcome to the smartest way to save money online. Our AI will analyze your preferences and send you personalized deals every day.</p>
            <p>What to expect:</p>
            <ul>
                <li>🔥 Daily curated deals based on your interests</li>
                <li>💰 Verified coupon codes that actually work</li>
                <li>🤖 AI-powered recommendations just for you</li>
                <li>📱 Mobile-friendly deal alerts</li>
            </ul>
            <p>Your first personalized deal email will arrive tomorrow morning at 8 AM.</p>
            <a href="https://fairdealhub.com" class="cta-button">Start Browsing Deals</a>
            <p>Happy saving!<br>The FairDealHub Team</p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateWelcomeText(content: any): string {
    return `
Welcome to FairDealHub!

🎉 You're all set for amazing deals!

Welcome to the smartest way to save money online. Our AI will analyze your preferences and send you personalized deals every day.

What to expect:
• 🔥 Daily curated deals based on your interests
• 💰 Verified coupon codes that actually work
• 🤖 AI-powered recommendations just for you
• 📱 Mobile-friendly deal alerts

Your first personalized deal email will arrive tomorrow morning at 8 AM.

Start browsing deals: https://fairdealhub.com

Happy saving!
The FairDealHub Team
`;
  }

  // Handle unsubscribe
  async unsubscribe(email: string, token?: string): Promise<void> {
    try {
      await storage.unsubscribe(email);
      console.log(`User unsubscribed: ${email}`);
    } catch (error) {
      console.error('Error processing unsubscribe:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
