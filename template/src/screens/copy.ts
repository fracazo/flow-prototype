/** Split a multi-paragraph copy value (a `- key: |` block in flows.md) into paragraphs. */
export function paragraphs(text: string | undefined): string[] {
  return (text ?? '').split(/\n{2,}/).filter(Boolean)
}
