const EmailService = require("./emailService");

const queue = [];
let processing = false;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const processQueue = async () => {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const job = queue.shift();
    try {
      const emailService = new EmailService(job.to);
      await emailService.send(job.payload);
    } catch (error) {
      job.attempts += 1;
      console.error("Email queue job failed:", {
        to: job.to,
        subject: job.payload?.subject,
        attempts: job.attempts,
        error: error.message,
      });

      if (job.attempts < MAX_ATTEMPTS) {
        await wait(RETRY_DELAY_MS);
        queue.push(job);
      }
    }
  }

  processing = false;
};

const enqueueEmail = ({ to, subject, message, template, templateData, attachments, senderEmail }) => {
  if (!to) return false;

  queue.push({
    to,
    attempts: 0,
    payload: {
      subject,
      message,
      template,
      templateData,
      attachments,
      senderEmail,
    },
  });

  setImmediate(processQueue);
  return true;
};

module.exports = {
  enqueueEmail,
  processQueue,
};
