import { PostManagerRequest } from "../types/post-types.ts";

export const validPostData: PostManagerRequest = {
  title: "Test Blog Post",
  content: `# Introduction

This is a test blog post with some content.

## Getting Started

Here's how to get started.

### Prerequisites

You need these prerequisites.`,
  abstract: "A test blog post for validation",
  status: "published",
  references: [
    {
      text: "Example Reference",
      url: "https://example.com",
      sequence_number: 1,
      start_position: 50,
      end_position: 67
    }
  ],
  fixed_tags: ["tag-1", "tag-2"],
  generated_tags: [
    { name: "test", confidence_score: 0.9 },
    { name: "blog", confidence_score: 0.8 }
  ]
};

export const invalidPostData = {
  title: "",
  content: "",
  references: [
    {
      text: "",
      sequence_number: -1,
      start_position: 10,
      end_position: 5
    }
  ]
};

export const updatePostData = {
  ...validPostData,
  post_id: "test-post-id-123",
  title: "Updated Blog Post"
};