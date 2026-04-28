const Joi = require("joi");
const { Types } = require("mongoose");

const validateMongoDbId = (value, helpers) => {
  if (!Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid MongoDB ObjectId");
  }
  return value;
};

// User validation schemas
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().required(),
  password: Joi.string().min(6).required(),
  designation: Joi.string().custom(validateMongoDbId).optional(),
  profileImage: Joi.string().optional(),
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  username: Joi.string().optional(),
  password: Joi.string().min(6).optional(),
  role: Joi.string().valid("user", "admin", "superadmin").optional(),
  designation: Joi.string().custom(validateMongoDbId).optional(),
  isActive: Joi.boolean().optional(),
  profileImage: Joi.string().optional(),
});

// Service validation schemas
const createServiceSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  image: Joi.string().required(),
  status: Joi.string().valid("Active", "Inactive").default("Active"),
});

const updateServiceSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  image: Joi.string().optional(),
  status: Joi.string().valid("Active", "Inactive").optional(),
});

// SubService validation schemas
const createSubServiceSchema = Joi.object({
  image: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  serviceId: Joi.string().custom(validateMongoDbId).required(),
  status: Joi.string().valid("Active", "Inactive").default("Active"),
});

const updateSubServiceSchema = Joi.object({
  image: Joi.string().optional(),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  serviceId: Joi.string().custom(validateMongoDbId).optional(),
  status: Joi.string().valid("Active", "Inactive").optional(),
});

// UserRole validation schemas
const routeShape = Joi.object({
  order: Joi.number().required(),
  title: Joi.string().required(),
  path: Joi.string().required(),
  permissions: Joi.array()
    .items(Joi.object().unknown(true))
    .optional()
    .default([]),
});

const createUserRoleSchema = Joi.object({
  roleName: Joi.string().required(),
  routes: Joi.array().items(routeShape).optional(),
  status: Joi.boolean().optional(),
});

const updateUserRoleSchema = Joi.object({
  roleName: Joi.string().optional(),
  routes: Joi.array().items(routeShape).optional(),
  status: Joi.boolean().optional(),
  totalRoutes: Joi.number().optional(),
});

// AboutUs validation schemas
const createAboutUsSchema = Joi.object({
  description: Joi.string().required(),
  image: Joi.string().required(),
});

const updateAboutUsSchema = Joi.object({
  description: Joi.string().optional(),
  image: Joi.string().optional(),
});

// Advertisement validation schemas
const createAdvertisementSchema = Joi.object({
  image: Joi.string().required(),
  status: Joi.string().valid("Active", "Inactive").default("Active"),
});

const updateAdvertisementSchema = Joi.object({
  image: Joi.string().optional(),
  status: Joi.string().valid("Active", "Inactive").optional(),
});

const updateAdvertisementTitleSchema = Joi.object({
  title: Joi.string().required(),
});

const createAdvertisementTitleSchema = Joi.object({
  title: Joi.string().required(),
});

// FAQ validation schemas
const createFAQSchema = Joi.object({
  title: Joi.string().required(),
  body: Joi.string().required(),
});

const updateFAQSchema = Joi.object({
  title: Joi.string().optional(),
  body: Joi.string().optional(),
});

// Opportunities validation schemas
const createOpportunitiesSchema = Joi.object({
  name: Joi.string().required(),
  opportunity: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        image: Joi.string().required(),
      }),
    )
    .min(1)
    .required(),
  status: Joi.string().valid("Active", "Inactive").default("Active"),
});

const updateOpportunitiesSchema = Joi.object({
  name: Joi.string().optional(),
  opportunity: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        image: Joi.string().required(),
      }),
    )
    .optional(),
  status: Joi.string().valid("Active", "Inactive").optional(),
});

// OurStory validation schemas
const createOurStorySchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
});

const updateOurStorySchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
});

// Work validation schemas
const createWorkSchema = Joi.object({
  workCategory: Joi.string().required(),
  categoryDescription: Joi.string().required(),
  serviceId: Joi.string().custom(validateMongoDbId).optional(),
  subServiceIds: Joi.array()
    .items(Joi.string().custom(validateMongoDbId))
    .optional(),
  works: Joi.array()
    .items(
      Joi.object({
        image: Joi.array().items(Joi.string()).required(),
        title: Joi.string().required(),
        url: Joi.string().required(),
        description: Joi.string().required(),
        purpose: Joi.string().required(),
      }),
    )
    .min(1)
    .required(),
  status: Joi.string().valid("active", "inactive").default("active"),
});

const updateWorkSchema = Joi.object({
  workCategory: Joi.string().optional(),
  categoryDescription: Joi.string().optional(),
  serviceId: Joi.string().custom(validateMongoDbId).optional(),
  subServiceIds: Joi.array()
    .items(Joi.string().custom(validateMongoDbId))
    .optional(),
  works: Joi.array()
    .items(
      Joi.object({
        image: Joi.string().required(),
        title: Joi.string().required(),
        url: Joi.string().required(),
        description: Joi.string().required(),
      }),
    )
    .optional(),
  status: Joi.string().valid("active", "inactive").optional(),
});

// TeamMember validation schemas
const createTeamMemberSchema = Joi.object({
  role: Joi.string().custom(validateMongoDbId).required(),
  name: Joi.string().required(),
  shortDescription: Joi.string().required(),
  image: Joi.string().required(),
  url: Joi.array()
    .items(
      Joi.object({
        siteName: Joi.string().required(),
        link: Joi.string().required(),
      }),
    )
    .optional(),
});

const updateTeamMemberSchema = Joi.object({
  role: Joi.string().custom(validateMongoDbId).optional(),
  name: Joi.string().optional(),
  shortDescription: Joi.string().optional(),
  image: Joi.string().optional(),
  url: Joi.array()
    .items(
      Joi.object({
        siteName: Joi.string().required(),
        link: Joi.string().required(),
      }),
    )
    .optional(),
});

// TeamRole validation schemas
const createTeamRoleSchema = Joi.object({
  role: Joi.string().required(),
});

const updateTeamRoleSchema = Joi.object({
  role: Joi.string().optional(),
});

// Review validation schemas
const createReviewSchema = Joi.object({
  userInfo: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    image: Joi.string().required(),
  }).required(),
  rating: Joi.number().min(1).max(5).required(),
  review: Joi.string().required(),
  status: Joi.string().valid("active", "inactive").default("active"),
});

// Resources validation schemas
const createResourceSchema = Joi.object({
  title: Joi.string().required(),
  subTitle: Joi.string().optional(),
  shortDescription: Joi.string().optional(),
  longDescription: Joi.string().optional(),
  image: Joi.string().optional(),
  productImages: Joi.array().items(Joi.string()).optional(),
  productLink: Joi.string().optional(),
  type: Joi.string().valid("blog", "article", "product").required(),
  postedOn: Joi.date().optional(),
});

const updateResourceSchema = Joi.object({
  title: Joi.string().optional(),
  subTitle: Joi.string().optional(),
  shortDescription: Joi.string().optional(),
  longDescription: Joi.string().optional(),
  image: Joi.string().optional(),
  productImages: Joi.array().items(Joi.string()).optional(),
  productLink: Joi.string().optional(),
  type: Joi.string().valid("blog", "article", "product").optional(),
  postedOn: Joi.date().optional(),
});

// Events validation schemas
const createEventSchema = Joi.object({
  title: Joi.string().required(),
  subTitle: Joi.string().optional(),
  shortDescription: Joi.string().optional(),
  longDescription: Joi.string().optional(),
  image: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required(),
      }),
    )
    .optional(),
  eventDate: Joi.date().optional(),
  video: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required(),
      }),
    )
    .optional(),
  location: Joi.string().optional(),
  type: Joi.string().valid("upcoming_event", "archive_event").required(),
});

// Proposal validation schemas
const createProposalSchema = Joi.object({
  fullname: Joi.string().min(3).max(120).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow(null, "").optional(),
  company: Joi.string().allow(null, "").optional(),
  services: Joi.array()
    .items(Joi.string().custom(validateMongoDbId))
    .optional(),
  subServices: Joi.array()
    .items(Joi.string().custom(validateMongoDbId))
    .optional(),
  budget: Joi.string().allow(null, "").optional(),
  messages: Joi.string().allow(null, "").optional(),
  nationalId: Joi.string().allow(null, "").optional(), // ✅ ADD
  password: Joi.string().min(6).allow(null, "").optional(), // ✅ ADD
  status: Joi.string()
    .valid("Pending", "Accepted", "Rejected", "In Progress", "Completed")
    .optional(),
  isActive: Joi.boolean().optional(),
});

const updateProposalSchema = Joi.object({
  fullname: Joi.string().min(3).max(120).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().allow(null, "").optional(),
  company: Joi.string().allow(null, "").optional(),
  services: Joi.array()
    .items(Joi.string().custom(validateMongoDbId))
    .optional(),
  subServices: Joi.array()
    .items(Joi.string().custom(validateMongoDbId))
    .optional(),
  budget: Joi.string().allow(null, "").optional(),
  messages: Joi.string().allow(null, "").optional(),
  status: Joi.string()
    .valid("Pending", "Accepted", "Rejected", "In Progress", "Completed")
    .optional(),
  isActive: Joi.boolean().optional(),
});

const updateProposalStatusSchema = Joi.object({
  status: Joi.string()
    .valid("Pending", "Accepted", "Rejected", "In Progress", "Completed")
    .required(),
});

// Phase validation schemas
const createPhaseSchema = Joi.object({
  title: Joi.string().min(2).max(150).required(),
  description: Joi.string().required(),
  proposalId: Joi.string().custom(validateMongoDbId).required(),
  images: Joi.array().items(Joi.string()).optional(),
});

const updatePhaseSchema = Joi.object({
  title: Joi.string().min(2).max(150).optional(),
  description: Joi.string().optional(),
  proposalId: Joi.string().custom(validateMongoDbId).optional(),
  images: Joi.array().items(Joi.string()).optional(),
});

// Applications validation schemas
const createApplicationSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  idType: Joi.string().valid("govt_id", "passport").required(),
  idNumber: Joi.string().required(),
  dateOfBirth: Joi.date().optional(),
  address: Joi.object({
    streetName: Joi.string().allow(null, "").optional(),
    city: Joi.string().allow(null, "").optional(),
    postalCode: Joi.string().allow(null, "").optional(),
  }).optional(),
  phone: Joi.object({
    phoneNumber: Joi.string().allow(null, "").optional(),
    landlineNumber: Joi.string().allow(null, "").optional(),
  }).optional(),
  education: Joi.object({
    highSchool: Joi.object({
      name: Joi.string().allow(null, "").optional(),
      city: Joi.string().allow(null, "").optional(),
    }).optional(),
    university: Joi.object({
      name: Joi.string().allow(null, "").optional(),
      city: Joi.string().allow(null, "").optional(),
    }).optional(),
  }).optional(),
  skills: Joi.array()
    .items(
      Joi.object({
        skill: Joi.string().required(),
        level: Joi.string()
          .valid("beginner", "intermediate", "advanced", "expert")
          .required(),
      }),
    )
    .optional(),
  cvResume: Joi.string().allow(null, "").optional(),
  picture: Joi.string().allow(null, "").optional(),
  certification: Joi.boolean().default(false),
});

const updateApplicationSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  idType: Joi.string().valid("govt_id", "passport").optional(),
  idNumber: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
  address: Joi.object({
    streetName: Joi.string().allow(null, "").optional(),
    city: Joi.string().allow(null, "").optional(),
    postalCode: Joi.string().allow(null, "").optional(),
  }).optional(),
  phone: Joi.object({
    phoneNumber: Joi.string().allow(null, "").optional(),
    landlineNumber: Joi.string().allow(null, "").optional(),
  }).optional(),
  education: Joi.object({
    highSchool: Joi.object({
      name: Joi.string().allow(null, "").optional(),
      city: Joi.string().allow(null, "").optional(),
    }).optional(),
    university: Joi.object({
      name: Joi.string().allow(null, "").optional(),
      city: Joi.string().allow(null, "").optional(),
    }).optional(),
  }).optional(),
  skills: Joi.array()
    .items(
      Joi.object({
        skill: Joi.string().optional(),
        level: Joi.string()
          .valid("beginner", "intermediate", "advanced", "expert")
          .optional(),
      }),
    )
    .optional(),
  cvResume: Joi.string().allow(null, "").optional(),
  picture: Joi.string().allow(null, "").optional(),
  certification: Joi.boolean().optional(),
  status: Joi.string().valid("pending", "approved", "rejected").optional(),
  isActive: Joi.boolean().optional(),
});

const updateApplicationStatusSchema = Joi.object({
  status: Joi.string().valid("pending", "approved", "rejected").required(),
});

// Common validation for MongoDB ObjectId
const mongoIdSchema = Joi.object({
  id: Joi.string().custom(validateMongoDbId).required(),
});

// Dashboard date range validation schema
const dashboardDateRangeSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
}).custom((value, helpers) => {
  if (value.startDate && value.endDate) {
    if (new Date(value.endDate) < new Date(value.startDate)) {
      return helpers.message(
        "endDate must be greater than or equal to startDate",
      );
    }
  }
  return value;
});

// Settings validation schemas
const createSettingsSchema = Joi.object({
  privacyPolicy: Joi.string().required(),
  termsCondition: Joi.string().required(),
  proposalEmailTemplate: Joi.string().allow("").optional(), // ✅ NAYA
  applicationEmailTemplate: Joi.string().allow("").optional(), // ✅ NAYA
  senderEmail: Joi.string().email().allow("").optional(),
  homeStats: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().required(),
        value: Joi.number().min(0).required(),
        suffix: Joi.string().allow("").optional(),
      }),
    )
    .optional(),
});

const updateSettingsSchema = Joi.object({
  privacyPolicy: Joi.string().optional(),
  termsCondition: Joi.string().optional(),
  proposalEmailTemplate: Joi.string().allow("").optional(), // ✅ NAYA
  applicationEmailTemplate: Joi.string().allow("").optional(), // ✅ NAYA
  senderEmail: Joi.string().email().allow("").optional(),
  homeStats: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().required(),
        value: Joi.number().min(0).required(),
        suffix: Joi.string().allow("").optional(),
      }),
    )
    .optional(),
});

module.exports = {
  validateMongoDbId,
  // User schemas
  createUserSchema,
  updateUserSchema,
  // Service schemas
  createServiceSchema,
  updateServiceSchema,
  // SubService schemas
  createSubServiceSchema,
  updateSubServiceSchema,
  // UserRole schemas
  createUserRoleSchema,
  updateUserRoleSchema,
  // AboutUs schemas
  createAboutUsSchema,
  updateAboutUsSchema,
  // Advertisement schemas
  createAdvertisementSchema,
  updateAdvertisementSchema,
  updateAdvertisementTitleSchema,
  createAdvertisementTitleSchema,
  // FAQ schemas
  createFAQSchema,
  updateFAQSchema,
  // Opportunities schemas
  createOpportunitiesSchema,
  updateOpportunitiesSchema,
  // OurStory schemas
  createOurStorySchema,
  updateOurStorySchema,
  // Work schemas
  createWorkSchema,
  updateWorkSchema,
  // TeamMember schemas
  createTeamMemberSchema,
  updateTeamMemberSchema,
  // TeamRole schemas
  createTeamRoleSchema,
  updateTeamRoleSchema,
  // Review schemas
  createReviewSchema,
  // Resources schemas
  createResourceSchema,
  updateResourceSchema,
  // Events schemas
  createEventSchema,
  // Proposal schemas
  createProposalSchema,
  updateProposalSchema,
  updateProposalStatusSchema,
  // Phase schemas
  createPhaseSchema,
  updatePhaseSchema,
  // Applications schemas
  createApplicationSchema,
  updateApplicationSchema,
  updateApplicationStatusSchema,
  // Dashboard schemas
  dashboardDateRangeSchema,
  // Settings validation schemas
  createSettingsSchema,
  updateSettingsSchema,
  // Common schemas
  mongoIdSchema,
};
