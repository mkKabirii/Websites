export type AboutUs = {
  description?: string;
  image?: string;
};

export type StoryEntry = {
  _id: string;
  title?: string;
  description?: string;
};

export type TeamRole = {
  _id?: string;
  role?: string;
  description?: string;
};

export type SocialLink = {
  siteName?: string;
  link?: string;
};

export type TeamMember = {
  _id?: string;
  name?: string;
  designation?: string;
  department?: string;
  shortDescription?: string;
  image?: string;
  role?: TeamRole;
  url?: SocialLink[];
};

export type TeamSection = {
  _id: string;
  role?: TeamRole;
  members?: TeamMember[];
};

