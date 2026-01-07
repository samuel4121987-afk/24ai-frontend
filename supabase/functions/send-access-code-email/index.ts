
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, code, userName } = await req.json();
    
    // Get email service API key from secrets
    const emailApiKey = Deno.env.get('EMAIL_API_KEY');
    
    if (!emailApiKey) {
      throw new Error('Email service not configured. Please add EMAIL_API_KEY to Supabase secrets.');
    }

    // Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px solid #06b6d4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #06b6d4; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .step { margin: 15px 0; padding-left: 30px; position: relative; }
          .step:before { content: "✓"; position: absolute; left: 0; color: #06b6d4; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to AI Control!</h1>
            <p>Your access has been approved</p>
          </div>
          <div class="content">
            <p>Hi ${userName || 'there'},</p>
            <p>Great news! Your request for AI Control access has been approved. You can now start controlling your computer with AI-powered commands.</p>
            
            <div class="code-box">
              ${code}
            </div>
            
            <p style="text-align: center; color: #666; font-size: 14px;">This is your unique access code. Keep it safe!</p>
            
            <div class="steps">
              <h3>🚀 Getting Started:</h3>
              <div class="step">Download the desktop agent for your platform</div>
              <div class="step">Install and run the agent</div>
              <div class="step">Enter your access code when prompted</div>
              <div class="step">Start giving AI commands!</div>
            </div>
            
            <div style="text-align: center;">
              <a href="${Deno.env.get('APP_URL') || 'https://24ai.org.es'}/dashboard" class="button">
                Open Dashboard
              </a>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              Need help? Reply to this email or visit our support page.<br>
              Your code expires in 1 year from today.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using your preferred service (SendGrid, Mailgun, etc.)
    // This is a placeholder - you'll need to configure your email service
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: '🎉 Your AI Control Access Code',
        }],
        from: {
          email: 'noreply@24ai.org.es',
          name: 'AI Control'
        },
        content: [{
          type: 'text/html',
          value: emailHtml
        }]
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Email service error: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
