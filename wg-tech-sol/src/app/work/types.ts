// TypeScript Types: Work module ke liye sab types yahan defined hain

// Work Item Type: Har individual work/project ke liye
export type WorkItem = {
  _id: string;
  image: string[]; // Array of image paths
  title: string; // Work ka title (ye brand ki jagah use hoga)
  url: string; // Project ka URL
  description: string; // Project ki detail
  purpose?: string; // Project ka purpose/subtitle
};

// Service ID Type: Service information ke liye (display nahi hota)
export type ServiceId = {
  _id: string;
  title: string;
  description: string;
  image: string;
};

// Sub Service ID Type: Sub service information ke liye (display nahi hota)
export type SubServiceId = {
  _id: string;
  image: string;
  title: string;
  description: string;
};

// Work Category Type: Har category ke liye jo multiple works contain karti hai
export type WorkCategory = {
  _id: string;
  workCategory: string; // Category ka naam
  categoryDescription: string; // Category ki description
  works: WorkItem[]; // Is category ke sab works
  serviceId: ServiceId; // Service info (display nahi hota)
  subServiceIds: SubServiceId[]; // Sub services info (display nahi hota)
  status: string;
  createdAt: string;
  updatedAt: string;
};

// WorkCard Props Type: WorkCard component ke props ke liye
export interface WorkCardProps {
  workData: WorkCategory[];
  loading: boolean;
}

// Transformed Project Type: Cards component ke liye transformed data
export type TransformedProject = {
  _id: string;
  slug: string;
  anchorId?: string;
  title: string;
  subTitle: string;
  image: string;
  images?: string[]; // Array of all images for carousel modal
  description: string;
  shortDescription: string;
  longDescription: string;
};
