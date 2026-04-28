import { jsPDF } from "jspdf";

const COMPANY_INFO = {
  name: "WGTECSOL (Pvt.) Ltd.",
  email: "info@wgtecsol.com",
  phone: "+92 329 2125592",
  website: "www.wgtecsol.com",
};

const DEFAULT_CONTENT = {
  projectTitle: "Technician Service Mobile Application",
  clientName: "Client Name",
  workflow: [
    {
      title: "1) Unit Registration",
      description:
        "Technician registers, completes profile, uploads ID documents, and gets verified before accessing jobs.",
    },
    {
      title: "2) FIR - Fault Inspection Report",
      description:
        "After reaching client location, technician inspects the issue and creates a Fault Inspection Report including problem details, notes, and initial media uploads.",
    },
    {
      title: "3) Quotation Generation",
      description:
        "Based on FIR, technician generates a service quotation/estimate which is sent to the client for approval.",
    },
    {
      title: "4) FCR - Fault Completion Report",
      description:
        "After client approval and job completion, technician submits a Fault Completion Report with final notes and before/after work evidence.",
    },
    {
      title: "5) Invoice & Payment Follow-up Voucher",
      description:
        "Final invoice is automatically generated after FCR. Payment status and follow-up voucher records are maintained in the app.",
    },
    {
      title: "6) Daily Report",
      description:
        "Technician can view and submit daily job activity reports for performance tracking.",
    },
  ],
  additionalFeatures: [
    "Job Assignment & Acceptance",
    "Online / Offline Availability",
    "GPS-based Check-In & Check-Out",
    "Break-In / Break-Out Tracking",
    "Before / After Image & Video Upload",
    "Job Start & Completion",
    "Rating & Performance Record",
    "Push Notifications",
  ],
  platforms: ["Android Application", "iOS Application"],
  timeline: "Total Duration: 2 Months",
  supportPoints: [
    "1 Month free bug-fix support after delivery.",
    "This quotation is valid for 15 days from the date of issue.",
    "If you need any modifications, feel free to let me know.",
    "Looking forward to working with you.",
  ],
  notesPoints: [
    "Client will provide Namecheap domain & Heroku credentials.",
    "All deliverables include responsive design, deployment and testing.",
    "Extra features (e.g., admin panel, e-commerce, membership) may incur additional charges.",
    "The client will provide the necessary accounts for publishing the app: a Google Play Store account for Android and an Apple App Store account for iOS, if required.",
  ],
  milestones: [
    { name: "Advance (Project Start)", percentage: "50%" },
    { name: "After UI Completion", percentage: "30%" },
    { name: "After Deployment & Go-Live", percentage: "20%" },
  ],
};

const stripHtml = (value) => {
  if (!value) return "";

  let text = String(value);

  if (typeof window !== "undefined") {
    const decoder = document.createElement("textarea");
    decoder.innerHTML = text;
    text = decoder.value;
  }

  text = text
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|h[1-6]|li|ol|ul)\s*>/gi, "\n")
    .replace(/<\s*\/?\s*[a-zA-Z][^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
};

const extractDescriptionBlocks = (value) => {
  const fallback = stripHtml(value);
  if (!fallback) {
    return [{ type: "paragraph", text: "No detailed description provided." }];
  }

  if (typeof window === "undefined") {
    return [{ type: "paragraph", text: fallback }];
  }

  const decoder = document.createElement("textarea");
  decoder.innerHTML = String(value || "");

  const wrapper = document.createElement("div");
  wrapper.innerHTML = decoder.value;

  const nodes = wrapper.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li");
  const blocks = [];

  nodes.forEach((node) => {
    const text = (node.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return;

    const tag = node.tagName.toLowerCase();
    if (tag.startsWith("h")) {
      blocks.push({ type: "heading", level: Number(tag[1]) || 3, text });
      return;
    }

    if (tag === "li") {
      blocks.push({ type: "paragraph", text: `- ${text}` });
      return;
    }

    blocks.push({ type: "paragraph", text });
  });

  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: fallback }];
};

const drawDescriptionBlocks = (
  doc,
  blocks,
  left,
  right,
  startY,
  footerBaseY,
) => {
  const contentWidth = right - left;
  let y = startY;

  for (const block of blocks) {
    const isHeading = block.type === "heading";
    const headingLevel = Number(block.level || 3);
    const fontSize = isHeading ? Math.max(9, 13 - headingLevel) : 8.5;
    const lineHeight = isHeading ? 12 : 11;

    doc.setFont("helvetica", isHeading ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(40, 40, 40);

    const lines = doc.splitTextToSize(String(block.text || ""), contentWidth);
    for (const line of lines) {
      if (y + lineHeight > footerBaseY - 2) {
        return;
      }
      doc.text(String(line), left, y);
      y += lineHeight;
    }

    y += isHeading ? 3 : 2;
    if (y > footerBaseY - 2) {
      return;
    }
  }
};

const drawFooterContactLinks = (doc, left, startY) => {
  const green = [124, 185, 0];
  const rows = [
    {
      label: COMPANY_INFO.website,
      url: `https://${String(COMPANY_INFO.website).replace(/^https?:\/\//i, "")}`,
      icon: "W",
    },
    {
      label: COMPANY_INFO.email,
      url: `mailto:${COMPANY_INFO.email}`,
      icon: "@",
    },
    {
      label: COMPANY_INFO.phone,
      url: `tel:${String(COMPANY_INFO.phone).replace(/\s+/g, "")}`,
      icon: "P",
    },
  ];

  rows.forEach((row, index) => {
    const y = startY + index * 14;

    doc.setDrawColor(...green);
    doc.setLineWidth(0.8);
    doc.circle(left + 5, y - 3, 4, "S");

    doc.setTextColor(...green);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(row.icon, left + 5, y - 1, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.textWithLink(String(row.label), left + 14, y, { url: row.url });

    const textWidth = doc.getTextWidth(String(row.label));
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(left + 14, y + 1, left + 14 + textWidth, y + 1);
  });
};

const loadImageAsDataUrl = (src) =>
  new Promise((resolve) => {
    if (!src || typeof window === "undefined") {
      resolve("");
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("");
          return;
        }
        ctx.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        resolve("");
      }
    };
    image.onerror = () => resolve("");
    image.src = src;
  });

const drawHeader = async (doc, pageWidth, options = {}) => {
  const green = [124, 185, 0];
  const headerTop = 18;
  const barY = 52;
  const barH = 20;

  const leftGreenW = 78;
  const leftBlackW = 228;

  const logoSize = 86;
  const rightPadding = 0;
  const logoGap = 10;
  const rightContinuationW = 96;
  const logoX =
    pageWidth - rightPadding - rightContinuationW - logoGap - logoSize;
  const logoY = headerTop;

  doc.setFillColor(...green);
  doc.rect(0, barY, leftGreenW, barH, "F");
  doc.setFillColor(0, 0, 0);
  doc.rect(leftGreenW, barY, leftBlackW, barH, "F");

  doc.setFillColor(...green);
  doc.rect(logoX + logoSize + logoGap, barY, rightContinuationW, barH, "F");

  const titleStartX = leftGreenW + leftBlackW + 8;
  const titleEndX = logoX - 12;
  const titleCenterX = (titleStartX + titleEndX) / 2;

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("WGTECSOL", titleCenterX, 48, { align: "center" });
  doc.setLineWidth(1);
  doc.line(titleCenterX - 60, 55, titleCenterX + 60, 55);
  doc.setFontSize(14);
  doc.text("(Pvt.) Ltd.", titleCenterX, 66, { align: "center" });
  doc.line(titleCenterX - 44, 71, titleCenterX + 44, 71);

  const logoData = await loadImageAsDataUrl(
    options.logoPath || "/images/Logo.png",
  );
  if (logoData) {
    doc.addImage(logoData, "PNG", logoX, logoY, logoSize, logoSize);
  } else {
    doc.setDrawColor(...green);
    doc.setLineWidth(4);
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, 38, "S");
  }

  return logoY + logoSize + 20;
};

const addWrappedText = (doc, text, x, y, maxWidth, lineHeight = 14) => {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
};

const ensureSpace = (doc, y, neededHeight) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + neededHeight < pageHeight - 120) return y;
  doc.addPage();
  return 44;
};

const enforceSinglePage = (doc) => {
  while (doc.getNumberOfPages() > 1) {
    doc.deletePage(doc.getNumberOfPages());
  }
};

const drawFooterDesign = (doc, pageWidth) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerHeight = 36;
  const footerTop = pageHeight - footerHeight;
  const green = [124, 185, 0];
  const leftGreenWidth = 180;
  const blackWidth = 230;
  const blackEndX = leftGreenWidth + blackWidth;

  doc.setFillColor(...green);
  doc.rect(0, footerTop, leftGreenWidth, footerHeight, "F");

  doc.setFillColor(0, 0, 0);
  doc.rect(leftGreenWidth, footerTop, blackWidth, footerHeight, "F");

  // Base dark wedge on right for stronger contrast
  doc.setFillColor(0, 0, 0);
  doc.triangle(
    blackEndX - 18,
    pageHeight,
    pageWidth - 16,
    pageHeight,
    pageWidth - 98,
    footerTop - 34,
    "F",
  );

  // Main green triangle starts slightly on black rectangle and rises higher.
  doc.setFillColor(98, 160, 0);
  doc.triangle(
    blackEndX - 44,
    pageHeight,
    pageWidth,
    pageHeight,
    pageWidth - 132,
    footerTop - 88,
    "F",
  );

  doc.setFillColor(...green);
  doc.triangle(
    blackEndX + 26,
    pageHeight,
    pageWidth - 8,
    pageHeight,
    pageWidth - 110,
    footerTop - 60,
    "F",
  );

  // Black angle on the right side of green triangles.
  doc.setFillColor(0, 0, 0);
  doc.triangle(
    pageWidth - 78,
    pageHeight,
    pageWidth,
    pageHeight,
    pageWidth,
    footerTop - 68,
    "F",
  );

  doc.setFillColor(145, 208, 0);
  doc.triangle(
    pageWidth - 174,
    pageHeight,
    pageWidth,
    pageHeight,
    pageWidth - 66,
    footerTop - 42,
    "F",
  );

  // Removed tiny right-most triangle per requested footer style.
};

const formatDate = (value) => {
  if (!value) return new Date().toLocaleDateString("en-GB");
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return new Date().toLocaleDateString("en-GB");
  return date.toLocaleDateString("en-GB");
};

const getClientLabel = (quotation) =>
  quotation?.clientName ||
  quotation?.client?.name ||
  quotation?.client?.fullName ||
  quotation?.client?.companyName ||
  quotation?.client?.email ||
  "Client";

const getCurrency = (quotation) =>
  quotation?.currency || quotation?.quotationDetails?.currency || "PKR";

const getTotalAmount = (quotation) => {
  if (quotation?.totalAmount) return Number(quotation.totalAmount);
  if (quotation?.quotationDetails?.totalAmount)
    return Number(quotation.quotationDetails.totalAmount);

  const items = quotation?.quotationDetails?.items || quotation?.items || [];
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    const qty = Number(item.qty ?? item.quantity ?? 1);
    const rate = Number(item.rate ?? item.unitPrice ?? 0);
    const lineTotal = Number.isFinite(qty * rate) ? qty * rate : 0;
    return sum + lineTotal;
  }, 0);
};

const formatMoney = (value, currency) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  const formatted = amount.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
};

const drawSectionTitle = (doc, text, x, y) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(String(text), x, y);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.6);
  doc.line(x, y + 6, x + 120, y + 6);
};

const drawMetaRow = (
  doc,
  left,
  right,
  y,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
) => {
  const mid = left + (right - left) * 0.55;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(String(leftLabel), left, y);
  doc.text(String(rightLabel), mid, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(10, 10, 10);
  doc.text(String(leftValue || "-"), left, y + 12);
  doc.text(String(rightValue || "-"), mid, y + 12);
};

const drawAmountCard = (doc, left, right, y, currency, total) => {
  const cardHeight = 46;
  doc.setFillColor(245, 248, 242);
  doc.roundedRect(left, y, right - left, cardHeight, 8, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text("Total Amount", left + 12, y + 18);
  doc.setFontSize(13);
  doc.setTextColor(18, 18, 18);
  doc.text(formatMoney(total, currency) || "-", left + 12, y + 34);

  const advance = total ? total * 0.5 : 0;
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(
    `Advance (50%): ${formatMoney(advance, currency) || "-"}`,
    right - 160,
    y + 30,
  );
};

const getCostBreakdown = (quotation) => {
  const items = quotation?.quotationDetails?.items || quotation?.items || [];
  if (!Array.isArray(items) || items.length === 0) {
    return [
      { item: "Figma", amount: "30,000" },
      { item: "UI Development (React Native)", amount: "90,000" },
      { item: "APP Functionality", amount: "60,000" },
      { item: "Backend Development (Node JS)", amount: "20,000" },
      { item: "Deployment", amount: "15,000" },
      { item: "Testing & Go-Live", amount: "5,000" },
    ];
  }

  return items.map((item) => {
    const qty = item.qty ?? item.quantity ?? 1;
    const rate = item.rate ?? item.unitPrice ?? 0;
    const total = Number(qty) * Number(rate);
    return {
      item: item.description || "Service Item",
      amount: total.toLocaleString("en-US"),
    };
  });
};

const buildDoc = async (quotation, options = {}) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currency = getCurrency(quotation);
  const totalAmount = getTotalAmount(quotation);
  const quotationId = quotation?._id
    ? String(quotation._id).slice(-6).toUpperCase()
    : "-";
  const descriptionBlocks = extractDescriptionBlocks(
    quotation?.longDescription || quotation?.shortDescription || "",
  );

  let y = await drawHeader(doc, pageWidth, options);
  const left = 32;
  const right = pageWidth - 32;

  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text("Quotation", left, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(90, 90, 90);
  doc.text(`Date: ${formatDate(quotation?.createdAt)}`, right, y, {
    align: "right",
  });
  y += 18;

  drawMetaRow(
    doc,
    left,
    right,
    y,
    "Client",
    getClientLabel(quotation),
    "Quotation ID",
    quotationId,
  );
  y += 28;
  drawMetaRow(
    doc,
    left,
    right,
    y,
    "Project",
    quotation?.title || "Quotation",
    "Currency",
    currency,
  );
  y += 28;

  drawAmountCard(doc, left, right, y, currency, totalAmount);
  y += 62;

  drawSectionTitle(doc, "Project Overview", left, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  const overviewText =
    quotation?.shortDescription ||
    "Please see the detailed scope and notes below.";
  y = addWrappedText(doc, overviewText, left, y, right - left, 12);
  y += 8;

  drawSectionTitle(doc, "Details", left, y);
  y += 16;

  const footerBaseY = pageHeight - 84;
  drawDescriptionBlocks(doc, descriptionBlocks, left, right, y, footerBaseY);

  drawFooterDesign(doc, pageWidth);
  drawFooterContactLinks(doc, 52, footerBaseY);

  enforceSinglePage(doc);
  return doc;
};

const makeSafeFileName = (value) =>
  String(value || "quotation")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "quotation";

export const downloadQuotationPdf = async (quotation, options = {}) => {
  const doc = await buildDoc(quotation, options);
  const filename = `${makeSafeFileName(quotation?.title || "quotation")}.pdf`;
  doc.save(filename);
};

export const openQuotationPdfPreview = async (quotation, options = {}) => {
  const previewWindow = window.open("about:blank", "_blank");

  if (previewWindow?.document) {
    previewWindow.document.title = "Generating quotation PDF...";
    previewWindow.document.body.innerHTML =
      "<div style='font-family:Arial,sans-serif;padding:24px;color:#111'>Preparing quotation preview...</div>";
  }

  const doc = await buildDoc(quotation, options);
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);

  if (previewWindow) {
    previewWindow.location.href = blobUrl;
    return;
  }

  // If popup is blocked, at least provide a usable output.
  doc.save(`${makeSafeFileName(quotation?.title || "quotation")}.pdf`);
};
