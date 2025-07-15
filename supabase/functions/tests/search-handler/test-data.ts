import { SearchRequest } from "../../search-handler/types/search-types.ts";

export const validSearchData: SearchRequest = {
  query: "web development",
  tags: ["dev", "javascript"],
  limit: 10,
  offset: 0,
  sort: "relevance",
  include_draft: false
};

export const textOnlySearchData: SearchRequest = {
  query: "test blog post",
  limit: 5,
  offset: 0,
  sort: "date_desc"
};

export const tagOnlySearchData: SearchRequest = {
  tags: ["dev", "tutorial"],
  limit: 10,
  offset: 0,
  sort: "relevance"
};

export const paginationSearchData: SearchRequest = {
  query: "test",
  limit: 3,
  offset: 6,
  sort: "date_asc"
};

export const emptySearchData: SearchRequest = {};

export const invalidSearchData = {
  query: "a".repeat(256), // Too long
  tags: Array(11).fill("tag"), // Too many
  limit: 100, // Too high
  offset: -1, // Negative
  sort: "invalid_sort" // Invalid option
};

export const edgeCaseSearchData = {
  query: "", // Empty string
  tags: [], // Empty array
  limit: 50, // Max valid
  offset: 0,
  sort: "relevance"
};

export const specialCharSearchData: SearchRequest = {
  query: 'search with "quotes" and special chars: @#$%',
  tags: ["special-tag"],
  limit: 5
};

export const longTagSearchData = {
  tags: ["a".repeat(51)], // Tag too long
  limit: 10
};