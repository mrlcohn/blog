export type BlogPost = {
  id: string; // Internal ID (for database)
  slug: string; // URL-friendly identifier
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
  tags: string[];
  coverImage?: string;
};
