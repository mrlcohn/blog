import type { BlogPost } from '../types/blog';

export const mockPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'getting-started-react-typescript',
    title: 'Getting Started with React and TypeScript',
    excerpt: 'Learn how to set up a modern React application with TypeScript, Vite, and Material-UI for a robust development experience.',
    content: `
# Getting Started with React and TypeScript

React and TypeScript make a powerful combination for building type-safe web applications. In this post, we'll explore the benefits and best practices.

## Why TypeScript?

TypeScript adds static typing to JavaScript, helping catch errors early and improving code quality. When combined with React, it provides excellent autocomplete and refactoring support.

## Setting Up Your Project

Using Vite as a build tool gives you lightning-fast hot module replacement and optimized production builds.

\`\`\`bash
npm create vite@latest my-app -- --template react-ts
\`\`\`

## Best Practices

1. Define prop types using interfaces
2. Use type inference where possible
3. Leverage utility types like Partial and Pick
4. Keep components focused and composable

Happy coding!
    `,
    author: 'Jane Developer',
    publishDate: '2024-01-15',
    tags: ['React', 'TypeScript', 'Web Development'],
  },
  {
    id: '2',
    slug: 'building-scalable-apis-aws',
    title: 'Building Scalable APIs with AWS',
    excerpt: 'Explore best practices for designing and deploying serverless APIs using AWS API Gateway and Lambda.',
    content: `
# Building Scalable APIs with AWS

AWS provides powerful tools for building serverless APIs that scale automatically with demand.

## Architecture Overview

Our architecture uses:
- API Gateway for HTTP endpoints
- Lambda functions for business logic
- DynamoDB for data persistence
- S3 for static asset hosting

## Benefits of Serverless

Serverless architectures offer several advantages:
- Pay only for actual usage
- Automatic scaling
- No server maintenance
- Built-in high availability

## Getting Started

Start by defining your API structure and creating Lambda functions for each endpoint.

\`\`\`javascript
exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from Lambda' })
  };
};
\`\`\`

Stay tuned for more AWS tips!
    `,
    author: 'John CloudArchitect',
    publishDate: '2024-01-10',
    tags: ['AWS', 'Serverless', 'API Gateway'],
  },
  {
    id: '3',
    slug: 'material-ui-design-patterns',
    title: 'Material-UI Design Patterns',
    excerpt: 'Discover common design patterns and component compositions using Material-UI to create beautiful user interfaces.',
    content: `
# Material-UI Design Patterns

Material-UI (MUI) is a comprehensive React component library based on Google's Material Design.

## Common Patterns

### Responsive Layouts

Use the Grid system for responsive layouts that adapt to different screen sizes.

### Theme Customization

Create a custom theme to match your brand:

\`\`\`typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});
\`\`\`

### Component Composition

Build complex UIs by composing simple MUI components together.

## Best Practices

1. Use the theme for consistent styling
2. Leverage sx prop for quick styles
3. Create custom components for repeated patterns
4. Test accessibility

MUI makes it easy to build professional UIs quickly!
    `,
    author: 'Sarah Designer',
    publishDate: '2024-01-05',
    tags: ['Material-UI', 'Design', 'React'],
  },
  {
    id: '4',
    slug: 'deploying-react-to-s3',
    title: 'Deploying React to S3',
    excerpt: 'Step-by-step guide to deploying your React application to AWS S3 with CloudFront for global content delivery.',
    content: `
# Deploying React to S3

Static site hosting on S3 is cost-effective and highly scalable.

## Build Your App

First, create a production build:

\`\`\`bash
npm run build
\`\`\`

## Configure S3

1. Create an S3 bucket
2. Enable static website hosting
3. Set bucket policy for public access
4. Upload your build folder

## Add CloudFront

For better performance, add CloudFront CDN in front of your S3 bucket.

## Automation

Consider using AWS CLI or infrastructure-as-code tools like CDK or Terraform for automated deployments.

\`\`\`bash
aws s3 sync build/ s3://your-bucket-name
\`\`\`

Your site is now live and globally distributed!
    `,
    author: 'Mike DevOps',
    publishDate: '2023-12-28',
    tags: ['AWS', 'S3', 'Deployment', 'React'],
  },
];
