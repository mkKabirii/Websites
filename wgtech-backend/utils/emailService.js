const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

class EmailService {
  constructor(userEmail) {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailService = process.env.EMAIL_SERVICE || "gmail";

    console.log("📧 Email Configuration:");
    console.log("   EMAIL_SERVICE:", emailService);
    console.log("   EMAIL_USER:", emailUser ? `${emailUser.substring(0, 5)}...` : "NOT SET");
    console.log("   EMAIL_PASS:", emailPass ? "SET" : "NOT SET");

    if (!emailUser || !emailPass) {
      const error = `Email credentials missing! USER: ${!emailUser ? "❌" : "✅"}, PASS: ${!emailPass ? "❌" : "✅"}`;
      console.error("❌", error);
      throw new Error(error);
    }

    this.to = userEmail;
    this.from = emailUser || "no-reply@replyce.com";

    // SMTP transport based on configured provider (defaults to Gmail)
    this.transporter = nodemailer.createTransport({
      service: emailService,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Render email template using EJS
   */
  async renderTemplate(templateName, data = {}) {
    const templatePath = path.join(
      __dirname,
      "..",
      "views",
      `${templateName}.ejs`
    );
    return await ejs.renderFile(templatePath, data);
  }

  /**
   * Send email with optional HTML template & attachments
   */
  async send({ subject, message, template, templateData, attachments, senderEmail }) {
    let htmlContent = message;

    try {
      console.log(`\n📧 Sending email to: ${this.to}`);
      console.log(`   Subject: ${subject}`);
      
      // Verify SMTP connection configuration
      try {
        await this.transporter.verify();
        console.log("   ✅ SMTP connection verified");
      } catch (verifyError) {
        console.error("   ❌ SMTP verification failed:", verifyError.message);
        throw verifyError;
      }

      if (template) {
        console.log(`   📄 Using template: ${template}`);
        htmlContent = await this.renderTemplate(template, templateData);
      }

      // Always send FROM the authenticated mailbox to avoid provider rejections.
      // If admin configured a custom sender email, expose it as Reply-To.
      const sanitizedReplyTo =
        senderEmail && String(senderEmail).includes("@") ? String(senderEmail).trim() : null;

      const mailOptions = {
        from: `WG Tech Solutions <${this.from}>`,
        replyTo: sanitizedReplyTo || undefined,
        to: this.to,
        subject: subject,
        text: message || "",
        html: htmlContent,
        attachments: attachments || [],
      };

      console.log("   🚀 Sending via nodemail...");
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully! MessageID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`\n❌ Email sending FAILED for ${this.to}`);
      console.error("   Error:", error.message);
      console.error("   Code:", error.code);
      console.error("   Response:", error.response);
      throw error;
    }
  }
}

module.exports = EmailService;
