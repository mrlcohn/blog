/**
 * API service for fetching blog data from the backend
 */

import { getAuthHeader } from '../utils/auth';

const API_BASE_URL = '/api';

export interface BlogPost {
  slug: string;
  title: string;
  author: string;
  publishDate: string;
  lastModifiedDate?: string;
  tags: string[];
  summary: string;
  content?: string;
  contentType?: string;
  imageKey?: string;
  status?: 'draft' | 'published';
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogCardData {
  slug: string;
  title: string;
  author: string;
  publishDate: string;
  tags: string[];
  summary: string;
  imageKey?: string;
}

export interface AboutData {
  name: string;
  bio: string;
  social?: Record<string, string>;
  content: string;
}

/**
 * Fetch all blog posts for the homepage cards
 */
export async function fetchBlogCards(): Promise<BlogCardData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/blogs`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('Error fetching blog cards:', error);
    return [];
  }
}

/**
 * Fetch a single blog post by slug
 */
export async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/${slug}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching blog post "${slug}":`, error);
    return null;
  }
}

/**
 * Fetch about me page content
 */
export async function fetchAbout(): Promise<AboutData> {
  try {
    const response = await fetch(`${API_BASE_URL}/about`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching about data:', error);
    return {
      name: '',
      bio: '',
      content: ''
    };
  }
}

/**
 * Fetch all blog posts for admin management (requires authentication)
 */
export async function fetchAdminPosts(): Promise<BlogPost[]> {
  try {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/admin/blogs`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('Error fetching admin posts:', error);
    throw error;
  }
}

/**
 * Update an existing blog post (requires authentication)
 */
export async function updateBlogPost(slug: string, data: {
  title: string;
  author: string;
  summary: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published';
}): Promise<{ slug: string; status: string; updatedAt: string }> {
  const authHeader = await getAuthHeader();
  if (!authHeader) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/blogs/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update blog post');
  }

  return await response.json();
}
