const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });
const EmailService = require("./utils/emailService");

const testEmailSending = async () => {
  try {
    console.log("\n📧 TESTING EMAIL SENDING\n");
    console.log("=" .repeat(70) + "\n");

    console.log("1️⃣ Email Configuration:");
    console.log("   EMAIL_USER:", process.env.EMAIL_USER || "NOT SET");
    console.log("   EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "NOT SET");
    console.log("   EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "NOT SET\n");

    console.log("2️⃣ Testing Email Service...");
    
    try {
      const emailService = new EmailService("test@example.com");
      console.log("✅ EmailService initialized\n");

      console.log("3️⃣ Sending Test Email...");

      const testEmail = `testuser${Date.now()}@gmail.com`;
      const emailServiceWithTestEmail = new EmailService(testEmail);

      const result = await emailServiceWithTestEmail.send({
        subject: "✅ Test Email from WG-TECH",
        message: `
          <h2>This is a test email</h2>
          <p>If you received this, the email service is working!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `,
        senderEmail: "noreply@wgtech.com"
      });

      console.log("✅ Email sent successfully!");
      console.log("   MessageID:", result.messageId);
      console.log("   To:", testEmail + "\n");

    } catch (emailServiceError) {
      console.log("❌ Email Service Error:");
      console.log("   Message:", emailServiceError.message);
      console.log("   Code:", emailServiceError.code);
      console.log("   Response:", emailServiceError.response);

      if (emailServiceError.message.includes("Email credentials missing")) {
        console.log("\n   🔧 FIX: Set EMAIL_USER and EMAIL_PASS in .env file");
      } else if (emailServiceError.code === "EAUTH") {
        console.log("\n   🔧 FIX: Check Gmail app password or enable less secure apps");
      }
    }

    console.log("\n" + "=" .repeat(70));
    console.log("\n✅ Email test complete\n");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
};

testEmailSending();
