const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Set default NODE_ENV
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

// Load environment variables
dotenv.config({ path: path.join(__dirname, "./config.dev.env") });

const DB = process.env.DATABASE_URL;

if (!DB) {
  console.error("❌ DATABASE_URL is not defined");
  process.exit(1);
}

mongoose
  .connect(DB, {
    retryWrites: true,
    w: "majority",
    serverSelectionTimeoutMS: 15000,
  })
  .then(async (conn) => {
    console.log(`✅ Connected to MongoDB`);

    // Get quotations collection
    const quotations = conn.connection.db.collection("quotations");
    
    // Get the first quotation document
    const firstQuotation = await quotations.findOne({});
    
    if (!firstQuotation) {
      console.log("❌ No quotations found in the database");
    } else {
      console.log("\n📋 First Quotation Document Structure:");
      console.log(JSON.stringify(firstQuotation, null, 2));
      
      // Check for required fields
      console.log("\n✅ Field Validation:");
      console.log("  _id:", firstQuotation._id ? "✓" : "✗");
      console.log("  title:", firstQuotation.title ? "✓" : "✗");
      console.log("  subTitle:", firstQuotation.subTitle ? "✓" : "✗");
      console.log("  shortDescription:", firstQuotation.shortDescription ? "✓" : "✗");
      console.log("  longDescription:", firstQuotation.longDescription ? "✓" : "✗");
      console.log("  image:", firstQuotation.image ? "✓" : "✗");
      console.log("  quotationDetails:", firstQuotation.quotationDetails ? "✓" : "✗");
      console.log("  status:", firstQuotation.status ? "✓" : "✗");
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection error:", err.message);
    process.exit(1);
  });
