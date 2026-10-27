/**
 * Utility functions for extracting and substituting variables in prompt templates.
 * Supports patterns like:
 * - [variable_name]
 * - {{variable_name}}
 * - {variable_name}
 */

export interface VariableField {
  raw: string; // e.g. "[target_audience]"
  key: string; // e.g. "target_audience"
  label: string; // e.g. "Target Audience"
  defaultValue?: string;
}

export function extractVariables(content: string): VariableField[] {
  if (!content) return [];

  // Match patterns: {{var}}, [var], or {var} where var doesn't contain spaces or brackets
  const regex = /\{\{([a-zA-Z0-9_\-\s]+)\}\}|\[([a-zA-Z0-9_\-\s]+)\]|\{([a-zA-Z0-9_\-]+)\}/g;
  const map = new Map<string, VariableField>();

  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const raw = match[0];
    const key = (match[1] || match[2] || match[3] || '').trim();

    // Skip if empty or looks like json/code brace blocks
    if (!key || key.length > 40 || key.includes('\n')) continue;

    if (!map.has(key.toLowerCase())) {
      const label = formatVariableLabel(key);
      map.set(key.toLowerCase(), {
        raw,
        key,
        label,
      });
    }
  }

  return Array.from(map.values());
}

export function formatVariableLabel(key: string): string {
  return key
    .replace(/[_\-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function replaceVariables(content: string, values: Record<string, string>): string {
  if (!content) return '';

  let result = content;
  for (const [key, val] of Object.entries(values)) {
    if (val === undefined || val === null) continue;
    
    // Escaping special regex characters in the key
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace {{key}}, [key], and {key} case-insensitively
    const pattern = new RegExp(`\\{\\{${escapedKey}\\}\\}|\\[${escapedKey}\\]|\\{${escapedKey}\\}`, 'gi');
    result = result.replace(pattern, val);
  }

  return result;
}
