const ENDPOINTS = {
  // Auth Endpoints
  loginUser: "v1/users/login",
  forgotPassword: "v1/users/forgot-password",
  resetPassword: "v1/users/reset-password",
  getNotifications: "v1/notifications",
  markNotificationRead: "v1/notifications",
  markAllNotificationsRead: "v1/notifications/read-all",
  getTasks: "v1/tasks",
  createTask: "v1/tasks",
  updateTask: "v1/tasks",
  addTaskUpdate: "v1/tasks",

  //ourStory
  createStory: "v1/ourstory",
  updateStory: "v1/ourstory",
  getStory: "v1/ourstory",
  deleteStory: "v1/ourstory",
  // Dashboard Endpoints
  getDashboardData: "v1/dashboard/analytics",
  // Service Endpoints
  getAllServices: "v1/services",
  createService: "v1/services",
  updateService: "v1/services",
  deleteService: "v1/services",
  // Faq Endpoints
  getAllFaq: "v1/faqs",
  deleteFaq: "v1/faqs",
  updateFaq: "v1/faqs",
  createFaq: "v1/faqs",
  //ourteam Endpoint
  getRollOptions: "v1/teamroles",
  getOurTeam: "v1/team",
  deleteOurTeam: "v1/team",
  createOurTeam: "v1/team",
  updateOurTeam: "v1/team",

  //SubService Endpoint
  getSubServiceOptions: "v1/services",

  //Review Endpoint

  getReview: "v1/reviews",
  deleteReview: "v1/reviews",
  createReview: "v1/reviews",
  updateReview: "v1/reviews",

  // Team Role

  getAllTeamRole: "v1/teamroles",
  deleteTeamRole: "v1/teamroles",
  updateTeamRole: "v1/teamroles",
  createTeamRole: "v1/teamroles",
  // Sub Service
  optionGetService: "v1/services",
  getAllSubServices: "v1/subservices",
  createSubService: "v1/subservices",
  updateSubService: "v1/subservices",
  deleteSubService: "v1/subservices",
  getSubServiceById: "v1/subservices/service",
  // About us
  getAllAboutUS: "v1/aboutus",
  createAboutUS: "v1/aboutus",
  updateAboutUs: "v1/aboutus",
  deleteAboutUS: "v1/aboutus",
  // Work

  optionGetWorkService: "v1/services",
  optionGetWorkSubService: "v1/subservices",
  getAllWork: "v1/works",
  updateWork: "v1/works",
  deleteWork: "v1/works",
  createWork: "v1/works",

  // Advertisement

  getAllAdvertisement: "v1/advertisements",
  createAdvertisement: "v1/advertisements",
  updateAdvertisement: "v1/advertisements",
  deleteAdvertisement: "v1/advertisements",

  //Opportunities
  getAllOpportunities: "v1/opportunities",
  createOpportunities: "v1/opportunities",
  updateOpportunities: "v1/opportunities",
  deleteOpportunities: "v1/opportunities",

  // Resources
  getAllArticles: "v1/resources/articles",
  getAllBlogs: "v1/resources/blogs",
  getAllProducts: "v1/resources/products",
  getAllResources: "v1/resources",
  updateResource: "v1/resources",
  deleteResource: "v1/resources",
  createResource: "v1/resources",

  //Proposals
  getProposal: "v1/proposals?page=1&limit=10",
  createProposal: "v1/proposals",
  updateProposals: "v1/proposals",
  deleteProposals: "v1/proposals",
  getAllProposalById: "v1/proposals",

  // Events
  getAllUpcomingEvents: "v1/events/upcoming",
  getAllArchiveEvents: "v1/events/archive",
  getAllEvents: "v1/events",
  updateEvents: "v1/events",
  deleteEvents: "v1/events",
  createEvents: "v1/events",

  // phases\
  getAllPhases: "v1/phases",
  updatePhases: "v1/phases",
  deletePhases: "v1/phases",
  createPhases: "v1/phases",

  //user role
  getAllUserRole: "v1/userroles",
  deleteUserRole: "v1/userroles",
  updateUserRole: "v1/userroles",
  createUserRole: "v1/userroles",
  //user
  getAllUsers: "v1/users",
  deleteUser: "v1/users",
  updateUser: "v1/users",
  createUser: "v1/users",
  getUserById: "v1/users",

  //project progress
  fetchProjectProgressByProposalId: "v1/phases/proposal",

  //applied forms

  getAllAppliedForms: "v1/applications",
  updateStatus: "v1/applications/status",
  getAppliedFormById: "v1/applications",

  //settings  
  fetchSettings: "v1/settings",
  updateSettings: "v1/settings",

};

export default ENDPOINTS;
