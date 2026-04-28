const COMPANY = "WGTECSOL (Pvt.) Ltd.";
const SUPPORT_EMAIL = "info@wgtecsol.com";
const SUPPORT_PHONE = "+92 329 2125592";

const normalize = (value, fallback = "N/A") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const toDate = (value) => {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime()))
    return new Date().toLocaleDateString("en-GB");
  return parsed.toLocaleDateString("en-GB");
};

const p = (text) =>
  `<p style="margin: 0 0 12px 0; font-size: 14px; color: #1f2937; line-height: 1.7;">${text}</p>`;
const ul = (items) =>
  `<ul style="margin: 0 0 12px 18px; padding: 0; font-size: 14px; color: #1f2937; line-height: 1.7;">
    ${items.map((item) => `<li style="margin: 0 0 6px 0;">${item}</li>`).join("")}
  </ul>`;

const wrap = (inner) => `
  <div style="background-color: #f3f4f6; padding: 24px 0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 0 16px;">
          <table role="presentation" width="720" cellspacing="0" cellpadding="0" style="border-collapse: collapse; max-width: 720px; width: 100%; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);">
            <tr>
              <td>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <tr>
                    <td width="20%" style="background: #7cb900; height: 8px;"></td>
                    <td width="60%" style="background: #0b0b0b; height: 8px;"></td>
                    <td width="20%" style="background: #7cb900; height: 8px;"></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 22px 28px 8px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <tr>
                    <td style="vertical-align: middle;">
                      <img src="https://wgtecsol.com/images/Logo.png" width="56" height="56" alt="WGTECSOL" style="display: block; border-radius: 12px;" />
                    </td>
                    <td style="text-align: right; vertical-align: middle;">
                      <div style="font-size: 12px; color: #6b7280; letter-spacing: 0.6px; text-transform: uppercase;">Company Update</div>
                      <div style="font-size: 18px; font-weight: 700; color: #111827;">${COMPANY}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 28px 18px 28px;">
                <div style="background: linear-gradient(135deg, #0b0b0b 0%, #1f2937 60%, #7cb900 100%); border-radius: 14px; padding: 18px 20px; color: #ffffff;">
                  <div style="font-size: 18px; font-weight: 700; letter-spacing: 0.3px;">Welcome to WGTECSOL</div>
                  <div style="font-size: 12px; color: #d1d5db; margin-top: 4px;">Innovate. Elevate. Transform.</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 28px 8px 28px;">
                <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px 18px 6px 18px;">
                  ${inner}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 28px 22px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <tr>
                    <td style="font-size: 12px; color: #6b7280;">
                      <strong style="color:#111827;">Need help?</strong><br />
                      Email: ${SUPPORT_EMAIL}<br />
                      Phone: ${SUPPORT_PHONE}
                    </td>
                    <td style="text-align: right; font-size: 12px; color: #6b7280;">
                      <strong style="color:#111827;">Follow us</strong><br />
                      LinkedIn | Instagram | X
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background: #0b0b0b; padding: 14px 28px; text-align: center; color: #9ca3af; font-size: 12px;">
                ${COMPANY} • ${SUPPORT_EMAIL} • ${SUPPORT_PHONE}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

const buildProposalStatusEmail = (status, data = {}) => {
  const partnerName = normalize(data.partnerName);
  const partnerId = normalize(data.partnerId);
  const partnerEmail = normalize(data.partnerEmail);
  const partnerPassword = normalize(data.partnerPassword);
  const portalLink = normalize(data.portalLink, "https://wgtecsol.com/");
  const projectId = normalize(data.projectId);
  const assignedWorker = normalize(
    data.assignedWorker,
    "Will be assigned shortly",
  );
  const startDate = toDate(data.startDate);
  const completionDate = toDate(data.completionDate);

  if (status === "Pending") {
    return {
      subject: "Thank You for Your Proposal - WGTECSOL (Pvt.) Ltd.",
      message: wrap(
        p(`Dear ${partnerName},`) +
          p(`Thank you for submitting your proposal to ${COMPANY}.`) +
          p(
            `We truly appreciate your interest in collaborating with ${COMPANY}. Your proposal has been successfully received and is currently under review by our team. We are carefully analyzing your requirements to ensure we fully understand your vision and expectations.`,
          ) +
          p(
            `At ${COMPANY}, every proposal is treated with professionalism and attention to detail, as we aim to build impactful and long-term partnerships.`,
          ) +
          p("What Happens Next?") +
          ul([
            "Our team will review your proposal thoroughly",
            "You may be contacted for additional details if required",
            "Once reviewed, you will be notified about the next step",
          ]) +
          p(
            `We appreciate your patience during this process and look forward to the possibility of working together with ${COMPANY}.`,
          ) +
          p("Need Help?") +
          p(`Email: ${SUPPORT_EMAIL}`) +
          p(`Phone: ${SUPPORT_PHONE}`) +
          p("Warm regards,") +
          p("Partnerships Team") +
          p(COMPANY),
      ),
    };
  }

  if (status === "Accepted") {
    return {
      subject:
        "Welcome to WGTECSOL (Pvt.) Ltd. - Your Partner Portal Access Details",
      message: wrap(
        p(`Dear ${partnerName},`) +
          p(`Welcome to ${COMPANY}.`) +
          p(
            "Thank you for your interest in our services and for submitting your proposal. We are truly pleased to welcome you as a valued partner and appreciate the confidence you have placed in our team.",
          ) +
          p(
            `At ${COMPANY}, we believe every new collaboration is the beginning of a meaningful professional relationship built on trust, innovation, and excellence. To ensure a smooth and secure experience, your Partner Portal has been successfully created, giving you direct access to the essential tools and information required to manage your project journey with us.`,
          ) +
          p(
            "Please keep this email safely stored for your records, as it contains your portal credentials and important access information.",
          ) +
          p("Partner Portal Access Details") +
          p(`Partner Name: ${partnerName}`) +
          p(`Partner ID: ${partnerId}`) +
          p(`Registered Email / User ID: ${partnerEmail}`) +
          p(`Password: ${partnerPassword}`) +
          p(`Portal Access Link: ${portalLink}`) +
          p("Through Your Partner Portal, You Will Be Able To") +
          ul([
            "Review your submitted proposal and service details",
            "Track project progress and status updates in a structured manner",
            `Communicate directly with the ${COMPANY} team`,
            "Receive important notifications related to your project activity",
            "Upload requirements, supporting files, and relevant documentation",
            "Manage your account information and profile details",
            "Access future projects and ongoing collaborations through the same account",
          ]) +
          p("Professional Access & Security Notice") +
          p(
            "Your account has been generated automatically based on the details submitted through your proposal form. For security purposes, we kindly request that you keep your login credentials confidential and do not share them with unauthorized individuals.",
          ) +
          p(
            `We also recommend reviewing your information after your first login to ensure that all details are accurate and up to date. Should you require any assistance regarding access, account updates, or portal support, our team at ${COMPANY} will be ready to assist you.`,
          ) +
          p("Policies, Privacy & Service Terms") +
          p(
            "We encourage you to review our Privacy Policy and service-related terms using the link below:",
          ) +
          p("https://wgtecsol.com/") +
          p(
            `By accessing your Partner Portal and continuing to engage with ${COMPANY} services, you acknowledge and agree to the applicable privacy practices, communication procedures, and operational terms.`,
          ) +
          p("Official Support & Contact Information") +
          p(`Official Email: ${SUPPORT_EMAIL}`) +
          p(`Contact Number / WhatsApp: ${SUPPORT_PHONE}`) +
          p(
            `We are honored to have the opportunity to work with you and look forward to building a productive, professional, and long-term partnership with ${COMPANY}.`,
          ) +
          p(`Thank you for choosing ${COMPANY}.`) +
          p("Warm regards,") +
          p("Partnerships & Client Relations Department") +
          p(COMPANY),
      ),
    };
  }

  if (status === "Rejected") {
    return {
      subject: "Update on Your Proposal - WGTECSOL (Pvt.) Ltd.",
      message: wrap(
        p(`Dear ${partnerName},`) +
          p(
            `Thank you for taking the time to submit your proposal to ${COMPANY}.`,
          ) +
          p(
            `After careful review, we regret to inform you that ${COMPANY} is unable to proceed with your proposal at this time. This decision has been made based on current project requirements, scope alignment, and internal evaluation criteria.`,
          ) +
          p("However, this is not the end of the road.") +
          p(
            `We strongly encourage you to refine your proposal and submit it again to ${COMPANY} in the future. We are always open to exploring new opportunities and collaborations.`,
          ) +
          p("Why You Can Reapply:") +
          ul([
            "Project requirements may change",
            "Improved proposal clarity can increase acceptance chances",
            `${COMPANY} values long-term potential partnerships`,
          ]) +
          p(
            `We sincerely appreciate your interest in ${COMPANY} and hope to work with you in the future.`,
          ) +
          p("Warm regards,") +
          p("Partnerships Team") +
          p(COMPANY),
      ),
    };
  }

  if (status === "In Progress") {
    return {
      subject:
        "Your Project is Now Active & In Progress - WGTECSOL (Pvt.) Ltd.",
      message: wrap(
        p(`Dear ${partnerName},`) +
          p(
            `We are pleased to inform you that your project with ${COMPANY} has now officially moved into the In Progress stage.`,
          ) +
          p(
            "Following your quotation approval and submission of the required details, our team has successfully completed the necessary verification process.",
          ) +
          p("Verification & Activation Confirmation") +
          p("We confirm that:") +
          ul([
            "Your project quotation has been signed/approved",
            "Your payment has been successfully received and verified",
            "Your submitted details and credentials have been reviewed and approved",
          ]) +
          p(
            "With all requirements successfully fulfilled, your project has now been officially activated, and our team has started working on it.",
          ) +
          p("Project Details") +
          p(`Project ID: ${projectId}`) +
          p(`Assigned Specialist: ${assignedWorker}`) +
          p(`Start Date: ${startDate}`) +
          p("What You Can Expect") +
          ul([
            "Regular progress updates via your Partner Portal",
            `Direct communication with the ${COMPANY} team`,
            "Structured workflow with clear milestones",
            "Professional handling and timely execution",
          ]) +
          p(
            "You can monitor real-time updates, share feedback, and stay connected with the team through your Partner Portal.",
          ) +
          p(
            `We are excited to bring your vision to life and ensure a smooth, transparent, and successful project journey with ${COMPANY}.`,
          ) +
          p(
            "If you have any questions or require further assistance, feel free to reach out to us at any time.",
          ) +
          p(`Email: ${SUPPORT_EMAIL}`) +
          p(`Phone: ${SUPPORT_PHONE}`) +
          p(`Thank you for your trust in ${COMPANY}.`) +
          p("Warm regards,") +
          p("Project Management Team") +
          p(COMPANY),
      ),
    };
  }

  return {
    subject:
      "Project Completed Successfully - Thank You for Choosing WGTECSOL (Pvt.) Ltd.",
    message: wrap(
      p(`Dear ${partnerName},`) +
        p(
          `We are delighted to inform you that your project with ${COMPANY} has been successfully completed.`,
        ) +
        p(
          `It has been a pleasure working with you, and we truly appreciate the trust you placed in ${COMPANY}.`,
        ) +
        p("Project Summary") +
        p(`Project ID: ${projectId}`) +
        p(`Completion Date: ${completionDate}`) +
        p("We hope the final outcome meets and exceeds your expectations.") +
        p("What\'s Next?") +
        ul([
          "You can review deliverables via your Partner Portal",
          `Share your feedback with ${COMPANY} (feedback button)`,
          `Start a new project anytime with ${COMPANY}`,
        ]) +
        p(
          `At ${COMPANY}, we believe in building long-term relationships, and we would be honored to collaborate with you again in the future.`,
        ) +
        p(
          `Thank you once again for choosing ${COMPANY} as your digital partner.`,
        ) +
        p("Warm regards,") +
        p("Client Relations Team") +
        p(COMPANY),
    ),
  };
};

const buildApplicationStatusEmail = (status, data = {}) => {
  const applicantName = normalize(data.applicantName);
  const position = normalize(data.position, "To be shared");
  const joiningDate = normalize(data.joiningDate, "To be shared");
  const department = normalize(data.department, "To be shared");

  if (status === "pending") {
    return {
      subject: "Application Received - WGTECSOL (Pvt.) Ltd.",
      message: wrap(
        p(`Dear ${applicantName},`) +
          p(`Thank you for applying to join ${COMPANY}.`) +
          p(
            `We have successfully received your application, and our recruitment team at ${COMPANY} is currently reviewing your profile and submitted details.`,
          ) +
          p(`We appreciate your interest in becoming a part of ${COMPANY}.`) +
          p("What Happens Next?") +
          ul([
            "Your application will be reviewed carefully",
            "Shortlisted candidates may be contacted",
            "You will receive an update regarding your application status",
          ]) +
          p(
            `We wish you the best of luck and thank you once again for considering ${COMPANY}.`,
          ) +
          p("Warm regards,") +
          p("HR Department") +
          p(COMPANY),
      ),
    };
  }

  if (status === "approved") {
    return {
      subject: "Congratulations! You\'ve Been Selected - WGTECSOL (Pvt.) Ltd.",
      message: wrap(
        p(`Dear ${applicantName},`) +
          p("Congratulations!") +
          p(
            `We are pleased to inform you that you have been successfully selected to join ${COMPANY}.`,
          ) +
          p(
            `After reviewing your application, we believe your skills and experience align well with the requirements of ${COMPANY}, and we are excited to welcome you to our team.`,
          ) +
          p("Your Selection Details") +
          p(`Position: ${position}`) +
          p(`Joining Date: ${joiningDate}`) +
          p(`Department: ${department}`) +
          p(
            `Further instructions regarding onboarding and workspace access at ${COMPANY} will be shared with you shortly.`,
          ) +
          p(
            "We look forward to your valuable contributions and a successful journey together.",
          ) +
          p(`Welcome to ${COMPANY}!`) +
          p("Warm regards,") +
          p("HR Department") +
          p(COMPANY),
      ),
    };
  }

  return {
    subject: "Application Update - WGTECSOL (Pvt.) Ltd.",
    message: wrap(
      p(`Dear ${applicantName},`) +
        p(
          `Thank you for your interest in joining ${COMPANY} and for taking the time to submit your application.`,
        ) +
        p(
          `After careful consideration, we regret to inform you that ${COMPANY} will not be moving forward with your application at this time.`,
        ) +
        p(
          `Please note that this decision does not reflect your potential, and we encourage you to apply again to ${COMPANY} in the future as new opportunities arise.`,
        ) +
        p(
          `We truly appreciate your interest in ${COMPANY} and wish you success in your professional journey.`,
        ) +
        p("Warm regards,") +
        p("HR Department") +
        p(COMPANY),
    ),
  };
};

const buildQuotationEmail = (eventType, data = {}) => {
  const partnerName = normalize(data.partnerName);
  const portalLink = normalize(data.portalLink, "https://wgtecsol.com/");

  if (eventType === "sent") {
    return {
      subject:
        "Project Quotation Available - Action Required | WGTECSOL (Pvt.) Ltd.",
      message: wrap(
        p(`Dear ${partnerName},`) +
          p("We hope you are doing well.") +
          p(
            `We are pleased to inform you that your project quotation has been successfully prepared by the team at ${COMPANY} and is now available in your Partner Portal.`,
          ) +
          p(
            "This quotation has been carefully structured based on your submitted requirements, ensuring clarity, transparency, and alignment with your project goals.",
          ) +
          p("Action Required") +
          p(
            "We kindly request you to log in to your Partner Portal and review the quotation details. After reviewing, please proceed with the quotation approval/signing process so that we can move forward with your project.",
          ) +
          p("Next Step After Approval") +
          ul([
            "Your project will be officially activated",
            "Work on your project will begin immediately",
            "Our assigned team will initiate the execution phase",
            "You will start receiving progress updates",
          ]) +
          p("Access Your Portal") +
          p(`Portal Link: ${portalLink}`) +
          p(
            `If you have any questions, require modifications, or need clarification regarding the quotation, feel free to reach out to the ${COMPANY} team. We are always here to assist you.`,
          ) +
          p("Official Support") +
          p(`Email: ${SUPPORT_EMAIL}`) +
          p(`Phone: ${SUPPORT_PHONE}`) +
          p(
            "We look forward to your approval and to starting this exciting journey with you.",
          ) +
          p(`Thank you for choosing ${COMPANY}.`) +
          p("Warm regards,") +
          p("Project Management Team") +
          p(COMPANY),
      ),
    };
  }

  return {
    subject:
      "Quotation Submitted Successfully - Next Steps | WGTECSOL (Pvt.) Ltd.",
    message: wrap(
      p(`Dear ${partnerName},`) +
        p(
          `Thank you for reviewing and signing your project quotation with ${COMPANY}.`,
        ) +
        p(
          "We appreciate your prompt action and your trust in moving forward with us.",
        ) +
        p("Quotation Submission Confirmation") +
        p("We are pleased to confirm that:") +
        ul([
          "Your project quotation has been successfully signed and submitted",
          "Your project is now ready to proceed to the next stage",
        ]) +
        p("What Happens Next?") +
        p(
          `Your project will now enter the verification and processing phase, where the team at ${COMPANY} will:`,
        ) +
        ul([
          "Review and verify your payment details",
          "Validate your submitted information and credentials",
          "Ensure all project requirements are fully aligned",
        ]) +
        p(
          "Once this process is completed and everything is successfully verified, your project will be moved to the In Progress stage, and work will officially begin.",
        ) +
        p("Important Note") +
        p(
          `This step is essential to maintain transparency, accuracy, and a smooth workflow throughout your project journey with ${COMPANY}.`,
        ) +
        p(
          "You will receive a confirmation email once your project is activated.",
        ) +
        p(
          "In the meantime, you can access your Partner Portal to stay updated and review your submitted quotation.",
        ) +
        p("Access Your Portal:") +
        p(`${portalLink}`) +
        p(
          `If you have any questions or need assistance, feel free to contact ${COMPANY}.`,
        ) +
        p(`Email: ${SUPPORT_EMAIL}`) +
        p(`Phone: ${SUPPORT_PHONE}`) +
        p(
          "We look forward to starting your project and building a successful partnership with you.",
        ) +
        p(`Thank you for choosing ${COMPANY}.`) +
        p("Warm regards,") +
        p("Project Coordination Team") +
        p(COMPANY),
    ),
  };
};

const buildReviewSubmittedEmail = (data = {}) => {
  const partnerName = normalize(data.partnerName);
  return {
    subject: "Thank You for Your Valuable Feedback - WGTECSOL (Pvt.) Ltd.",
    message: wrap(
      p(`Dear ${partnerName},`) +
        p(
          `Thank you for taking the time to share your valuable feedback regarding your recent project with ${COMPANY}.`,
        ) +
        p(
          `We truly appreciate your input and are grateful for the trust you have placed in ${COMPANY}. Your feedback plays a vital role in helping us continuously improve our services and maintain the highest standards of quality and professionalism.`,
        ) +
        p(
          `At ${COMPANY}, every client experience matters, and your review not only motivates our team but also helps us refine our processes to serve you even better in the future.`,
        ) +
        p("Your Support Means a Lot") +
        ul([
          "Your feedback helps us grow and improve",
          "It strengthens our commitment to excellence",
          "It inspires our team to deliver even better results",
        ]) +
        p(
          "We are honored to have worked with you and would love the opportunity to collaborate again on future projects.",
        ) +
        p(
          `If you have any upcoming ideas or projects, ${COMPANY} will always be ready to assist you.`,
        ) +
        p("Stay Connected") +
        p(`Email: ${SUPPORT_EMAIL}`) +
        p(`Phone: ${SUPPORT_PHONE}`) +
        p(
          `Once again, thank you for choosing ${COMPANY} and for sharing your experience with us.`,
        ) +
        p("Warm regards,") +
        p("Client Relations Team") +
        p(COMPANY),
    ),
  };
};

const buildChatNotificationEmail = (type, data = {}) => {
  const clientName = normalize(data.clientName, "Client");
  const partnerName = normalize(data.partnerName, clientName);
  const projectId = normalize(data.projectId);
  const messageTime = normalize(
    data.messageTime,
    new Date().toLocaleString("en-GB"),
  );
  const messagePreview = normalize(
    data.messagePreview,
    "(No preview available)",
  );
  const chatLink = normalize(data.chatLink, "https://wgtecsol.com/");
  const workerName = normalize(data.workerName, "Project Team Member");

  if (type === "client_to_admin") {
    return {
      subject: `New Message from ${clientName} - WGTECSOL (Pvt.) Ltd.`,
      message: wrap(
        p("Dear Admin,") +
          p(
            `You have received a new message from ${clientName} through the ${COMPANY} communication portal.`,
          ) +
          p("Message Details") +
          p(`Sender: ${clientName}`) +
          p(`Project ID: ${projectId}`) +
          p(`Time: ${messageTime}`) +
          p(`Message Preview: \"${messagePreview}\"`) +
          p(
            "To respond or view the complete conversation, please access your dashboard.",
          ) +
          p(`View & Reply to Message: ${chatLink}`) +
          p(
            "Timely communication helps ensure smooth project execution and client satisfaction.",
          ) +
          p("Warm regards,") +
          p("System Notification") +
          p(COMPANY),
      ),
    };
  }

  if (type === "admin_to_client") {
    return {
      subject: "New Message from WGTECSOL (Pvt.) Ltd. Team",
      message: wrap(
        p(`Dear ${partnerName},`) +
          p(
            `You have received a new message from the ${COMPANY} team regarding your project.`,
          ) +
          p("Message Details") +
          p("Sender: Admin Team") +
          p(`Project ID: ${projectId}`) +
          p(`Time: ${messageTime}`) +
          p(`Message Preview: \"${messagePreview}\"`) +
          p(
            "We encourage you to review and respond promptly to stay updated on your project progress.",
          ) +
          p(`View & Reply to Message: ${chatLink}`) +
          p(
            `If you need any assistance, feel free to reach out to ${COMPANY} at any time.`,
          ) +
          p("Warm regards,") +
          p("Client Communication Team") +
          p(COMPANY),
      ),
    };
  }

  if (type === "client_to_group") {
    return {
      subject: "New Client Message in Project Workspace - WGTECSOL (Pvt.) Ltd.",
      message: wrap(
        p("Dear Team,") +
          p(
            `A new message has been posted by ${clientName} in the project workspace.`,
          ) +
          p("Workspace Details") +
          p(`Project ID: ${projectId}`) +
          p(`Sender: ${clientName}`) +
          p(`Time: ${messageTime}`) +
          p(`Message Preview: \"${messagePreview}\"`) +
          p(
            "Please review the message and respond if necessary to maintain workflow continuity.",
          ) +
          p(`Open Workspace Conversation: ${chatLink}`) +
          p("Consistent communication ensures efficient project delivery.") +
          p("Warm regards,") +
          p("System Notification") +
          p(COMPANY),
      ),
    };
  }

  if (type === "worker_to_group") {
    return {
      subject: "New Update from Project Team - WGTECSOL (Pvt.) Ltd.",
      message: wrap(
        p(`Dear ${partnerName},`) +
          p(
            `A new message has been shared by a project team member in your workspace at ${COMPANY}.`,
          ) +
          p("Workspace Details") +
          p(`Project ID: ${projectId}`) +
          p(`Sender: ${workerName}`) +
          p(`Time: ${messageTime}`) +
          p(`Message Preview: \"${messagePreview}\"`) +
          p(
            "You can view the full update and respond directly through your Partner Portal.",
          ) +
          p(`View Message & Respond: ${chatLink}`) +
          p(
            "We recommend staying engaged to ensure smooth collaboration and timely updates.",
          ) +
          p("Warm regards,") +
          p("Project Coordination Team") +
          p(COMPANY),
      ),
    };
  }

  return {
    subject: "New Message from Project Manager - WGTECSOL (Pvt.) Ltd.",
    message: wrap(
      p(`Dear ${partnerName},`) +
        p(
          `A new message has been shared by the project manager in your workspace at ${COMPANY}.`,
        ) +
        p("Workspace Details") +
        p(`Project ID: ${projectId}`) +
        p("Sender: Admin Team") +
        p(`Time: ${messageTime}`) +
        p(`Message Preview: \"${messagePreview}\"`) +
        p("Please review the message and take any necessary action.") +
        p(`Open Workspace & Reply: ${chatLink}`) +
        p(
          "For best results, we recommend responding promptly and keeping communication active.",
        ) +
        p("Warm regards,") +
        p("Project Management Team") +
        p(COMPANY),
    ),
  };
};

module.exports = {
  buildProposalStatusEmail,
  buildApplicationStatusEmail,
  buildQuotationEmail,
  buildReviewSubmittedEmail,
  buildChatNotificationEmail,
};
