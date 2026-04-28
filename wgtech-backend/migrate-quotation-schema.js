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
  .connect(DB)
  .then(async (conn) => {
    console.log(`✅ Connected to MongoDB`);

    const quotations = conn.connection.db.collection("quotations");
    
    // Update all quotations that don't have title field
    const result = await quotations.updateMany(
      { title: { $exists: false } },
      {
        $set: {
          title: "Untitled Quotation",
          subTitle: "Professional Quotation",
          shortDescription: "Service quotation",
          longDescription: "Professional quotation for services rendered",
          image: null,
        }
      }
    );

    console.log(`\n✅ Migration completed:`);
    console.log(`   - Matched documents: ${result.matchedCount}`);
    console.log(`   - Modified documents: ${result.modifiedCount}`);

    // Verify the update
    const firstQuotation = await quotations.findOne({});
    if (firstQuotation) {
      console.log("\n📋 Sample Updated Quotation:");
      console.log(`   - Title: ${firstQuotation.title}`);
      console.log(`   - SubTitle: ${firstQuotation.subTitle}`);
      console.log(`   - Short Description: ${firstQuotation.shortDescription}`);
      console.log(`   - Long Description: ${firstQuotation.longDescription}`);
      console.log(`   - Image: ${firstQuotation.image}`);
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
