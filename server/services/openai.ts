import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR 
});

export interface ProductCategorization {
  category: string;
  subcategory?: string;
  confidence: number;
  keywords: string[];
}

export interface ProductContent {
  title: string;
  description: string;
  features: string[];
  benefits: string[];
}

export interface CouponGeneration {
  codes: Array<{
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minimumSpend?: number;
    expiresIn: number; // days
  }>;
}

export interface EmailContent {
  subject: string;
  preview: string;
  content: {
    greeting: string;
    mainContent: string;
    dealsList: Array<{
      title: string;
      description: string;
      originalPrice: number;
      salePrice: number;
      discount: string;
      ctaText: string;
    }>;
    closingMessage: string;
  };
}

export class OpenAIService {
  // Categorize products using AI
  async categorizeProduct(productName: string, productDescription: string): Promise<ProductCategorization> {
    try {
      const prompt = `Analyze this product and categorize it accurately. Return JSON format.
      
Product: ${productName}
Description: ${productDescription}

Categorize this product into one of these main categories: Electronics, Fashion, Home & Garden, Sports & Outdoors, Beauty & Health, Toys & Games, Books & Media, Automotive, Travel, Food & Beverages.

Return JSON with: category, subcategory (if applicable), confidence (0-1), keywords (array of relevant tags).`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert product categorization system. Respond only with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        category: result.category || 'Uncategorized',
        subcategory: result.subcategory,
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        keywords: Array.isArray(result.keywords) ? result.keywords : []
      };
    } catch (error) {
      console.error('Error categorizing product:', error);
      return {
        category: 'Uncategorized',
        confidence: 0,
        keywords: []
      };
    }
  }

  // Generate optimized product content
  async generateProductContent(productName: string, originalDescription: string, category: string): Promise<ProductContent> {
    try {
      const prompt = `Create optimized marketing content for this product. Return JSON format.

Product: ${productName}
Category: ${category}
Original Description: ${originalDescription}

Generate:
1. Optimized title (compelling, SEO-friendly)
2. Enhanced description (engaging, benefit-focused)
3. Key features list (3-5 bullet points)
4. Customer benefits (3-5 value propositions)

Format as JSON with: title, description, features (array), benefits (array).`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert copywriter specializing in e-commerce product descriptions. Create compelling, conversion-focused content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        title: result.title || productName,
        description: result.description || originalDescription,
        features: Array.isArray(result.features) ? result.features : [],
        benefits: Array.isArray(result.benefits) ? result.benefits : []
      };
    } catch (error) {
      console.error('Error generating product content:', error);
      return {
        title: productName,
        description: originalDescription,
        features: [],
        benefits: []
      };
    }
  }

  // Generate coupon codes for merchants
  async generateCouponCodes(merchantName: string, productCategory: string, count = 5): Promise<CouponGeneration> {
    try {
      const prompt = `Generate ${count} unique coupon codes for ${merchantName} in the ${productCategory} category. Return JSON format.

Create varied discount types and values:
- Mix of percentage (10-50%) and fixed amount ($5-100) discounts
- Different minimum spend requirements
- Expiration periods (7-30 days)
- Creative, memorable coupon codes (6-12 characters)

Format as JSON with: codes array containing { code, description, discountType, discountValue, minimumSpend, expiresIn }.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a marketing specialist creating attractive coupon offers. Generate realistic, varied discount codes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        codes: Array.isArray(result.codes) ? result.codes : []
      };
    } catch (error) {
      console.error('Error generating coupon codes:', error);
      return { codes: [] };
    }
  }

  // Generate personalized email content
  async generateEmailContent(
    userPreferences: string[], 
    deals: Array<{ name: string; originalPrice: number; salePrice: number; merchant: string }>,
    emailType: 'daily' | 'weekly' | 'welcome'
  ): Promise<EmailContent> {
    try {
      const prompt = `Create a personalized ${emailType} deals email. Return JSON format.

User interests: ${userPreferences.join(', ')}
Available deals: ${JSON.stringify(deals)}

Generate:
1. Compelling subject line
2. Preview text (50-100 chars)
3. Email content with:
   - Personal greeting
   - Main content introducing deals
   - Formatted deals list (title, description, prices, discount %, CTA text)
   - Closing message with next steps

Make it personal, engaging, and action-oriented. Focus on savings and value.

Format as JSON with: subject, preview, content: { greeting, mainContent, dealsList, closingMessage }.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert email marketing copywriter. Create engaging, personalized content that drives conversions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        subject: result.subject || `Your ${emailType} deals are ready!`,
        preview: result.preview || 'Save big on your favorite items',
        content: {
          greeting: result.content?.greeting || 'Hi there!',
          mainContent: result.content?.mainContent || 'Check out these amazing deals we found for you.',
          dealsList: Array.isArray(result.content?.dealsList) ? result.content.dealsList : [],
          closingMessage: result.content?.closingMessage || 'Happy shopping!'
        }
      };
    } catch (error) {
      console.error('Error generating email content:', error);
      return {
        subject: `Your ${emailType} deals are ready!`,
        preview: 'Save big on your favorite items',
        content: {
          greeting: 'Hi there!',
          mainContent: 'Check out these amazing deals we found for you.',
          dealsList: [],
          closingMessage: 'Happy shopping!'
        }
      };
    }
  }

  // Analyze trending keywords for product discovery
  async analyzeTrendingKeywords(category: string): Promise<string[]> {
    try {
      const prompt = `Generate 20 trending product keywords for the ${category} category. Return JSON format.

Focus on:
- Popular product types
- Seasonal trends
- Emerging technologies
- Consumer pain points
- Brand-agnostic terms

Return JSON with: keywords (array of strings).`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a market research analyst specializing in e-commerce trends. Provide current, relevant keywords."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return Array.isArray(result.keywords) ? result.keywords : [];
    } catch (error) {
      console.error('Error analyzing trending keywords:', error);
      return [];
    }
  }
}

export const openaiService = new OpenAIService();
