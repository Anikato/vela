import { describe, it, expect } from 'vitest';

import { escapeHtml } from '../email.utils';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('handles strings with no special characters', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('handles empty strings', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('escapes multiple special characters in one string', () => {
    expect(escapeHtml('<a href="test">&</a>')).toBe(
      '&lt;a href=&quot;test&quot;&gt;&amp;&lt;/a&gt;',
    );
  });

  it('handles strings with only special characters', () => {
    expect(escapeHtml('&<>"')).toBe('&amp;&lt;&gt;&quot;');
  });

  it('preserves single quotes (not escaped)', () => {
    expect(escapeHtml("it's fine")).toBe("it's fine");
  });
});
