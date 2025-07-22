// lib/stripMarkdown.ts

export function stripMarkdown(markdown: string): string {
  // Remove code blocks and inline code
  markdown = markdown.replace(/`{1,3}[\s\S]*?`{1,3}/g, '');

  // Remove image tags
  markdown = markdown.replace(/!\[.*?\]\(.*?\)/g, '');

  // Convert links [text](url) to just text
  markdown = markdown.replace(/\[([^\]]+)\]\(.*?\)/g, '$1');

  // Remove emphasis, bold, strike, headings, blockquotes, etc.
  markdown = markdown.replace(/[*_~#>`-]+/g, '');

  // Normalize newlines
  markdown = markdown.replace(/\n{2,}/g, '\n');

  return markdown.trim();
}
