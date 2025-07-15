import { TocEntry } from "../types/post-types.ts";

export class TocService {
  generateToc(content: string): TocEntry[] {
    const tocEntries: TocEntry[] = [];
    const lines = content.split('\n');
    let position = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('#')) {
        const level = this.getHeadingLevel(trimmedLine);
        const title = this.extractHeadingTitle(trimmedLine);
        const anchor = this.generateAnchor(title);

        tocEntries.push({
          level,
          title,
          anchor,
          position_in_content: position,
        });
      }

      position += line.length + 1; // +1 for newline character
    }

    return tocEntries;
  }

  private getHeadingLevel(line: string): number {
    const match = line.match(/^#+/);
    return match ? Math.min(match[0].length, 6) : 1;
  }

  private extractHeadingTitle(line: string): string {
    return line.replace(/^#+\s*/, '').trim();
  }

  private generateAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
}