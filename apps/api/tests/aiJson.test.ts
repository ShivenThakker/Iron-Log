import { describe, it, expect } from 'vitest';
import { safeParseJson, extractJsonText } from '../src/utils/aiJson';

describe('aiJson utils', () => {
  describe('extractJsonText', () => {
    it('extracts plain json unchanged', () => {
      expect(extractJsonText('{"a":1}')).toBe('{"a":1}');
    });

    it('strips markdown code fences', () => {
      expect(extractJsonText('```json\n{"a":1}\n```')).toBe('{"a":1}');
      expect(extractJsonText('```\n{"a":1}\n```')).toBe('{"a":1}');
    });

    it('extracts json from surrounding conversational text', () => {
      const text = 'Here is your plan: {"a": 1, "b": [2]} Hope this helps!';
      expect(extractJsonText(text)).toBe('{"a": 1, "b": [2]}');
    });
  });

  describe('safeParseJson', () => {
    it('successfully parses valid json', () => {
      const result = safeParseJson('{"name": "Upper Body", "days": []}');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ name: 'Upper Body', days: [] });
      }
    });

    it('successfully parses fenced json with chatter', () => {
      const result = safeParseJson('Sure! ```json\n{"success": true}\n``` Enjoy!');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ success: true });
      }
    });

    it('rejects empty or whitespace string', () => {
      expect(safeParseJson('')).toEqual({ ok: false, reason: 'empty' });
      expect(safeParseJson('   \n\t')).toEqual({ ok: false, reason: 'empty' });
    });

    it('rejects input exceeding max char limit', () => {
      const huge = '{"a":"' + 'x'.repeat(250_000) + '"}';
      expect(safeParseJson(huge)).toEqual({ ok: false, reason: 'too_large' });
    });

    it('rejects malformed or truncated json', () => {
      expect(safeParseJson('{"a": [1, 2, ')).toEqual({ ok: false, reason: 'invalid_json' });
      expect(safeParseJson('invalid json string')).toEqual({ ok: false, reason: 'invalid_json' });
    });
  });
});
