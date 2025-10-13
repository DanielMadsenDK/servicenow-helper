/**
 * Utility functions for extracting raw markdown content from container blocks
 */

/**
 * Extracts raw markdown content from a container block
 * Supports flexible whitespace handling and streaming (incomplete blocks)
 *
 * @param fullContent - The complete markdown string
 * @param containerType - The container type (e.g., 'agent', 'agent-tool', 'agent-description')
 * @param index - Which occurrence to extract (0 = first, 1 = second, etc.). Defaults to 0.
 * @param allowIncomplete - If true, extracts content even if closing marker is missing (for streaming). Defaults to true.
 * @returns The raw markdown content between the container markers
 *
 * @example
 * const content = '::: agent\n\n**Bold text**\n\n:::';
 * const extracted = extractContainerContent(content, 'agent', 0);
 * // Returns: '**Bold text**'
 *
 * @example
 * // During streaming (incomplete block)
 * const content = '::: agent\n\n**Bold text**';
 * const extracted = extractContainerContent(content, 'agent', 0, true);
 * // Returns: '**Bold text**'
 */
export function extractContainerContent(
  fullContent: string,
  containerType: string,
  index: number = 0,
  allowIncomplete: boolean = true
): string {
  // First try: Match complete blocks (with closing :::)
  const completeRegex = new RegExp(
    `::: ${containerType}\\s*\\n+([\\s\\S]*?)\\s*\\n+:::`,
    'g'
  );

  const completeMatches = Array.from(fullContent.matchAll(completeRegex));

  if (completeMatches[index] && completeMatches[index][1]) {
    // Trim any leading/trailing whitespace from extracted content
    return completeMatches[index][1].trim();
  }

  // Second try: If incomplete blocks are allowed, match without closing marker
  // This enables progressive rendering during streaming
  if (allowIncomplete) {
    const incompleteRegex = new RegExp(
      `::: ${containerType}\\s*\\n+([\\s\\S]*)$`,
      'g'
    );

    const incompleteMatches = Array.from(fullContent.matchAll(incompleteRegex));

    if (incompleteMatches[index] && incompleteMatches[index][1]) {
      // Return content even if block isn't closed yet
      return incompleteMatches[index][1].trim();
    }
  }

  return '';
}

/**
 * Counts how many containers of a specific type exist in the content
 * Useful for handling multiple blocks of the same type
 *
 * @param fullContent - The complete markdown string
 * @param containerType - The container type to count
 * @returns The number of containers of the specified type
 *
 * @example
 * const content = '::: agent\nContent 1\n:::\n\n::: agent\nContent 2\n:::';
 * const count = countContainers(content, 'agent');
 * // Returns: 2
 */
export function countContainers(fullContent: string, containerType: string): number {
  const regex = new RegExp(`::: ${containerType}\\s*\\n+[\\s\\S]*?\\s*\\n+:::`, 'g');
  const matches = fullContent.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Extracts all containers of a specific type
 * Returns an array of raw markdown content for each container
 *
 * @param fullContent - The complete markdown string
 * @param containerType - The container type to extract
 * @returns Array of raw markdown strings for each container
 *
 * @example
 * const content = '::: agent\nFirst\n:::\n\n::: agent\nSecond\n:::';
 * const all = extractAllContainers(content, 'agent');
 * // Returns: ['First', 'Second']
 */
export function extractAllContainers(fullContent: string, containerType: string): string[] {
  const count = countContainers(fullContent, containerType);
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    const content = extractContainerContent(fullContent, containerType, i);
    if (content) {
      results.push(content);
    }
  }

  return results;
}
