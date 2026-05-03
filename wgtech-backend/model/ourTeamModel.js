const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamRole",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
    },
    url: [
      {
        siteName: {
          type: String,
          required: true,
        },
        link: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true, collection: "teammembers" }
);

// Ensure collection is created
mongoose.model("TeamMember", teamMemberSchema).createCollection();

module.exports = mongoose.model("TeamMember", teamMemberSchema);
