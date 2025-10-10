export default async function sendMail({ 
  to, 
  subject, 
  text, 
  html 
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const key = Deno.env.get("SENDGRID_API_KEY");
  if (!key) {
    console.warn("SENDGRID_API_KEY not set, skipping email");
    return;
  }
  
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${key}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: "noreply@sidehive.app", name: "SideHive" },
        subject,
        content: [
          ...(text ? [{ type: "text/plain", value: text }] : []),
          ...(html ? [{ type: "text/html", value: html }] : []),
        ],
      }),
    });
    
    if (!response.ok) {
      console.error("SendGrid error:", await response.text());
    }
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}
