// Home page ke liye TypeScript types

export interface FAQItem {
  _id?: string;
  title: string;
  body: string;
  createdAt?: {
    $date: string;
  };
  updatedAt?: {
    $date: string;
  };
  __v?: number;
}

export interface ServiceItem {
  _id?: string;
  title: string;
  description: string;
  image?: string;
  alt?: string;
  link?: string;
}

export interface ReviewItem {
  _id?: string;
  review: string;
  rating: number;
  status: string;
  userInfo: {
    name: string;
    email: string;
    image?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface AdvertisementItem {
  _id?: string;
  image?: string;
}

export interface HomeStatItem {
  label: string;
  value: number;
  suffix?: string;
}

export interface HomeData {
  faqs?: FAQItem[];
  services?: ServiceItem[];
  reviews?: ReviewItem[];
  advertisements?: AdvertisementItem[];
  homeStats?: HomeStatItem[];
}
