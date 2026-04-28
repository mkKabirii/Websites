const ENDPOINTS = {
  // Auth Endpoints
  loginUser: "v1/users/login",
  // loginUser: "v1/auth/login",
  // about us
  getAboutUs: "v1/aboutus/web",
  // service
  getServices: "v1/services/with-subservices",
  getAllServices: "v1/services",
  getSubServicesbyServiceId: "v1/subservices/service",
  // work
  getAllWork: "v1/works",
  // ourstory
  getStory: "v1/ourstory",
  // blog
  getAllBlogs: "v1/resources/blogs",
  getBlogById: "v1/resources/blogs",
  // article
  getAllArticles: "v1/resources/articles",
  getArticleById: "v1/resources/articles",
  // product
  getAllProducts: "v1/resources/products",
  getProductById: "v1/resources/products",

  // event
  getAllEvents: "v1/events/sorted",
  getEventById: "v1/events",


  // home
  getHomeData: "v1/home",
  getOpportunitiesData: "v1/opportunities/all",


  // application
  createApplication: "v1/applications",

  //upload
  upload: "v1/upload/file",

  // proposals
  createProposal: "v1/proposals",


  //settings

  getSetting:"v1/settings"

};

export default ENDPOINTS;
