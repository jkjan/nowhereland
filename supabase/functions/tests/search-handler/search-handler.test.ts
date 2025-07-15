import { assertEquals, assertExists } from "jsr:@std/assert";
import { validateSearchRequest } from "../../search-handler/validators/search-validator.ts";
import { SearchService } from "../../search-handler/services/search-service.ts";
import { validSearchData, invalidSearchData, edgeCaseSearchData } from "./test-data.ts";

Deno.test("SearchHandler - Validation Tests", async (t) => {
  await t.step("should accept valid search data", () => {
    const result = validateSearchRequest(validSearchData);
    
    assertEquals(result.isValid, true);
    assertEquals(result.errors.length, 0);
  });

  await t.step("should reject invalid search data", () => {
    const result = validateSearchRequest(invalidSearchData);
    
    assertEquals(result.isValid, false);
    assertEquals(result.errors.length, 4);
    assertEquals(result.errors[0], "Query must be 255 characters or less");
    assertEquals(result.errors[1], "Maximum 10 tags allowed");
    assertEquals(result.errors[2], "Limit must be between 1 and 50");
    assertEquals(result.errors[3], "Offset must be 0 or greater");
  });

  await t.step("should handle edge case data", () => {
    const result = validateSearchRequest(edgeCaseSearchData);
    
    assertEquals(result.isValid, true);
    assertEquals(result.errors.length, 0);
  });

  await t.step("should validate sort options", () => {
    const data = { sort: 'invalid_sort' };
    const result = validateSearchRequest(data);
    
    assertEquals(result.isValid, false);
    assertEquals(result.errors[0], "Sort must be one of: relevance, date_desc, date_asc");
  });

  await t.step("should validate tag length limits", () => {
    const data = { tags: ['a'.repeat(51)] };
    const result = validateSearchRequest(data);
    
    assertEquals(result.isValid, false);
    assertEquals(result.errors[0], "Each tag must be 50 characters or less");
  });

  await t.step("should validate tag type", () => {
    const data = { tags: [123, 'valid-tag'] };
    const result = validateSearchRequest(data);
    
    assertEquals(result.isValid, false);
    assertEquals(result.errors[0], "All tags must be strings");
  });

  await t.step("should accept empty request", () => {
    const data = {};
    const result = validateSearchRequest(data);
    
    assertEquals(result.isValid, true);
    assertEquals(result.errors.length, 0);
  });
});

Deno.test("SearchHandler - Service Tests", async (t) => {
  await t.step("should create SearchService instance", () => {
    const searchService = new SearchService();
    assertExists(searchService);
  });

  // Note: More comprehensive service tests would require a test database
  // These would be integration tests that set up test data
});

Deno.test("SearchHandler - Integration Tests", async (t) => {
  await t.step("should create service instances without errors", () => {
    const searchService = new SearchService();
    assertExists(searchService);
  });

  await t.step("should validate search request structure", () => {
    const validRequest = {
      query: "web development",
      tags: ["dev", "tutorial"],
      limit: 5,
      offset: 0,
      sort: "relevance" as const
    };

    const result = validateSearchRequest(validRequest);
    assertEquals(result.isValid, true);
  });
});