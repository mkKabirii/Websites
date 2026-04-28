const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const API_BASE = "http://localhost:8003/api/v1";

// Test token (you'll need a valid admin token)
const ADMIN_TOKEN = "your-admin-token-here";

const testApproveQuotation = async () => {
  try {
    console.log("🧪 Testing Approve Quotation with Client Account Creation...\n");

    // 1. Get all quotations to find one that's signed
    console.log("1️⃣ Fetching quotations...");
    const quotationsRes = await axios.get(`${API_BASE}/quotations`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });

    console.log(`Found ${quotationsRes.data.data.length} quotations`);
    
    // Find a signed quotation
    const signedQuotation = quotationsRes.data.data.find(q => q.status === "signed");
    
    if (!signedQuotation) {
      console.log("❌ No signed quotation found for testing");
      console.log("Available statuses:", quotationsRes.data.data.map(q => q.status));
      return;
    }

    console.log(`✅ Found signed quotation: ${signedQuotation._id}`);
    console.log(`   Client ID: ${signedQuotation.clientId._id}`);
    console.log(`   Status: ${signedQuotation.status}\n`);

    // 2. Get worker data for assignment
    console.log("2️⃣ Fetching workers...");
    const workersRes = await axios.get(`${API_BASE}/users?role=worker`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });

    if (workersRes.data.data.length === 0) {
      console.log("❌ No workers found");
      return;
    }

    const workerId = workersRes.data.data[0]._id;
    console.log(`✅ Selected worker: ${workerId}\n`);

    // 3. Approve the quotation
    console.log("3️⃣ Approving quotation and creating client account...");
    const approveRes = await axios.post(
      `${API_BASE}/quotations/${signedQuotation._id}/approve`,
      {
        workerId: workerId,
        department: "IT",
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );

    console.log("✅ Quotation approved successfully!");
    console.log(`   Status: ${approveRes.data.data.status}`);
    console.log(`   Message: ${approveRes.data.message}\n`);

    // 4. Get updated client info
    console.log("4️⃣ Fetching updated client data...");
    const clientRes = await axios.get(
      `${API_BASE}/clients/${signedQuotation.clientId._id}`,
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );

    const updatedClient = clientRes.data.data;
    console.log(`✅ Client Info:`);
    console.log(`   Name: ${updatedClient.name}`);
    console.log(`   Email: ${updatedClient.email}`);
    console.log(`   UserId: ${updatedClient.userId}`);
    console.log(`   Assigned Worker: ${updatedClient.assignedWorker}\n`);

    // 5. Try to verify the new user was created
    if (updatedClient.userId) {
      console.log("5️⃣ Fetching new client user account...");
      const userRes = await axios.get(`${API_BASE}/users/${updatedClient.userId}`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });

      const clientUser = userRes.data.data;
      console.log(`✅ Client User Account Created:`);
      console.log(`   Email: ${clientUser.email}`);
      console.log(`   Role: ${clientUser.role}`);
      console.log(`   Full Name: ${clientUser.fullname}`);
      console.log(`   Active: ${clientUser.isActive}\n`);
    }

    console.log("✨ Test completed successfully!");
    console.log("📧 Email with credentials should have been sent to:", updatedClient.email);

  } catch (error) {
    console.error("❌ Error during test:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Message:", error.response.data.message);
      console.error("Details:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
};

testApproveQuotation();
