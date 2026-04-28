const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       lowercase: true,
//     },
//     username: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     profileImage: {
//       type: String,
//       default: "",
//     },
//     password: {
//       type: String,
//     required: true,
//     },
//     designation: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "UserRole",
//       required: false,
//     },
//     otp: {
//       type: String,
//       default: "",
//     },
//     otpExpiresAt: {
//       type: Date,
//       default: null,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   {
//     timestamps: true,
//     collection: "users",
//   }
// );

// // Ensure collection is created
// mongoose.model("User", userSchema).createCollection();

// module.exports = mongoose.model("User", userSchema);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    // ✅ NAYA ADD KARO
    fullname: {
      type: String,
      default: "",
      trim: true,
    },
    // ✅ NAYA ADD KARO
    nationalId: {
      type: String,
      default: null,
    },
    profileImage: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserRole",
      required: false,
    },
    otp: {
      type: String,
      default: "",
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    resetOtp: { type: String, default: null },
    resetOtpExpiry: { type: Date, default: null },
    profilePicture: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    // For workers: clients assigned to them
    assignedClients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
      },
    ],
    // For workers: their department
    assignedDepartment: {
      type: String,
      default: null,
    },
    // User role for role-based access
    role: {
      type: String,
      enum: ["admin", "worker", "client", "user"],
      default: "user",
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// ✅ Password hashing middleware
const bcrypt = require("bcryptjs");

userSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ LAST LINE BHI FIX KARO — double model error band hoga
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
