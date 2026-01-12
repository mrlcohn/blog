export type BlogPost = {
  slug: string;
  title: string;
  author: string;
  publishDate: string;
  tags: string[];
  summary: string; // Brief summary for cards
  content?: string; // Full content (only in detail view)
  lastModifiedDate?: string;
  contentType?: string;
  imageKey?: string;
};
