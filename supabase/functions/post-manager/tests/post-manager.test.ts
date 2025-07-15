import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { PostService } from "../services/post-service.ts";
import { TocService } from "../services/toc-service.ts";
import { validatePostRequest } from "../validators/post-validator.ts";

Deno.test("PostManager - Validation Tests", async (t) => {
  await t.step("should validate required fields", () => {
    const invalidData = { title: "", content: "" };
    const result = validatePostRequest(invalidData, "POST");
    
    assertEquals(result.isValid, false);
    assertEquals(result.errors.length, 2);
    assertEquals(result.errors[0], "Title is required");
    assertEquals(result.errors[1], "Content is required");
  });

  await t.step("should validate title length", () => {
    const longTitle = "a".repeat(256);
    const data = { title: longTitle, content: "test content" };
    const result = validatePostRequest(data, "POST");
    
    assertEquals(result.isValid, false);
    assertEquals(result.errors[0], "Title must be 255 characters or less");
  });

  await t.step("should validate references", () => {
    const data = {
      title: "Test",
      content: "Test content",
      references: [{
        text: "",
        sequence_number: 0,
        start_position: -1,
        end_position: 5
      }]
    };
    const result = validatePostRequest(data, "POST");
    
    assertEquals(result.isValid, false);
    assertEquals(result.errors.length, 3);
  });

  await t.step("should validate PATCH requires post_id", () => {
    const data = { title: "Test", content: "Test content" };
    const result = validatePostRequest(data, "PATCH");
    
    assertEquals(result.isValid, false);
    assertEquals(result.errors[0], "post_id is required for updates");
  });
});

Deno.test("PostManager - TOC Generation Tests", async (t) => {
  const tocService = new TocService();

  await t.step("should generate TOC from markdown headers", () => {
    const content = `# Introduction
This is an introduction.

## Getting Started
Let's get started.

### Prerequisites
You need these.

# Conclusion
That's it!`;

    const toc = tocService.generateToc(content);
    
    assertEquals(toc.length, 4);
    assertEquals(toc[0].level, 1);
    assertEquals(toc[0].title, "Introduction");
    assertEquals(toc[0].anchor, "introduction");
    assertEquals(toc[1].level, 2);
    assertEquals(toc[1].title, "Getting Started");
    assertEquals(toc[1].anchor, "getting-started");
  });

  await t.step("should handle complex titles in TOC", () => {
    const content = "## Getting Started: A Developer's Guide!";
    const toc = tocService.generateToc(content);
    
    assertEquals(toc[0].title, "Getting Started: A Developer's Guide!");
    assertEquals(toc[0].anchor, "getting-started-a-developers-guide");
  });

  await t.step("should return empty array for content without headers", () => {
    const content = "Just some regular content without headers.";
    const toc = tocService.generateToc(content);
    
    assertEquals(toc.length, 0);
  });
});

Deno.test("PostManager - Integration Tests", async (t) => {
  // Mock environment variables for testing
  Deno.env.set("SUPABASE_URL", "http://localhost:54321");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-key");
  
  await t.step("should create post manager response structure", () => {
    const postService = new PostService();
    assertExists(postService);
  });
});