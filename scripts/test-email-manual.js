import { initEmailService } from "../packages/email/src/index.js";
import { sendEmail } from "../packages/email/src/index.js";
import config from "../packages/config/src/env.js";

async function testEmail() {
  try {
    console.log("Initializing email service...");
    await initEmailService();

    console.log("Sending test email...");
    console.log("FROM:", config.emailFrom);
    console.log("TO:", "logtest@example.com"); // This will fail if not registered email

    await sendEmail({
      to: "logtest@example.com",
      subject: "Test Email",
      text: "This is a test email",
      html: "<p>This is a test email</p>",
    });

    console.log("Email sent successfully!");
  } catch (error) {
    console.error("EMAIL FAILED:", error);
    if (error.originalError) {
      console.error("ORIGINAL ERROR:", error.originalError);
    }
  }
}

testEmail();
