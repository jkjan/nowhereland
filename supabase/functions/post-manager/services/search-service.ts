import { SearchDocument } from "../types/post-types.ts";

export class SearchService {
  private opensearchUrl = Deno.env.get("OPENSEARCH_URL");
  private opensearchUsername = Deno.env.get("OPENSEARCH_USERNAME");
  private opensearchPassword = Deno.env.get("OPENSEARCH_PASSWORD");

  async indexPost(document: SearchDocument): Promise<void> {
    if (!this.opensearchUrl) {
      console.warn("OpenSearch not configured, skipping indexing");
      return;
    }

    try {
      const indexName = "posts";
      const url = `${this.opensearchUrl}/${indexName}/_doc/${document.id}`;
      
      const credentials = this.opensearchUsername && this.opensearchPassword
        ? btoa(`${this.opensearchUsername}:${this.opensearchPassword}`)
        : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (credentials) {
        headers["Authorization"] = `Basic ${credentials}`;
      }

      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title: document.title,
          content: document.content,
          abstract: document.abstract,
          tags: document.tags,
          published_at: document.published_at,
          indexed_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenSearch indexing failed: ${response.status} ${error}`);
      }

      console.log(`Successfully indexed post ${document.id} to OpenSearch`);
    } catch (error) {
      console.error("OpenSearch indexing error:", error);
      throw error;
    }
  }

  async deletePost(postId: string): Promise<void> {
    if (!this.opensearchUrl) {
      console.warn("OpenSearch not configured, skipping deletion");
      return;
    }

    try {
      const indexName = "posts";
      const url = `${this.opensearchUrl}/${indexName}/_doc/${postId}`;
      
      const credentials = this.opensearchUsername && this.opensearchPassword
        ? btoa(`${this.opensearchUsername}:${this.opensearchPassword}`)
        : null;

      const headers: Record<string, string> = {};

      if (credentials) {
        headers["Authorization"] = `Basic ${credentials}`;
      }

      const response = await fetch(url, {
        method: "DELETE",
        headers,
      });

      if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(`OpenSearch deletion failed: ${response.status} ${error}`);
      }

      console.log(`Successfully deleted post ${postId} from OpenSearch`);
    } catch (error) {
      console.error("OpenSearch deletion error:", error);
      throw error;
    }
  }
}