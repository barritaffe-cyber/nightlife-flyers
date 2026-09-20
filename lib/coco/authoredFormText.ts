/** Keep the master’s display conventions; the brief remains the user's raw input. */
export function authoredFormText(authored: string, value: string) {
  // Links and email addresses are functional data: preserve case-sensitive paths.
  const links: string[] = [];
  const protectedValue = value.replace(/https?:\/\/\S+|www\.\S+|[^\s@]+@[^\s@]+\.[^\s@]+/gi, link => `\uE000${links.push(link) - 1}\uE001`);
  if (!links.length && value.toLowerCase() === authored.toLowerCase()) return authored;
  const originals = authored.split('\n');
  const lines = protectedValue.split('\n');
  const output = lines.map((line, index) => formatCase(originals.length === lines.length ? originals[index] : authored, line, authored)).join('\n');
  return output.replace(/\uE000(\d+)\uE001/g, (_, index) => links[Number(index)]);
}

const words = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;
const smallWords = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
const acronyms = new Set(['DJ', 'MC', 'VIP', 'RSVP', 'AM', 'PM', 'R&B', 'UK', 'USA']);
const lettersOf = (text: string) => Array.from(text).filter(c => c.toLowerCase() !== c.toUpperCase());
const titleWord = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

function formatCase(reference: string, value: string, wholeReference: string): string {
  const letters = lettersOf(reference);
  if (!letters.length) return value;
  if (reference === reference.toUpperCase()) return value.toUpperCase();
  if (reference === reference.toLowerCase()) return value.toLowerCase();
  const tokens = reference.match(words) ?? [];
  const title = tokens.every(token => token === titleWord(token) || token === token.toUpperCase() || smallWords.has(token));
  const upperCount = letters.filter(c => c === c.toUpperCase()).length;
  if (!title && upperCount / letters.length >= .75) {
    if (tokens.length === 1) {
      // Some glyph titles deliberately use a lower-case first/last character
      // (oFFSHORE, MOJITo). Preserve that edge treatment for replacement words.
      const leading = letters.findIndex(c => c === c.toUpperCase());
      const trailing = [...letters].reverse().findIndex(c => c === c.toUpperCase());
      return value.replace(words, word => {
        const chars = Array.from(word.toUpperCase());
        return chars.map((c, i) => i < leading || i >= chars.length - trailing ? c.toLowerCase() : c).join('');
      });
    }
    return value.toUpperCase();
  }
  const canonical = new Map((wholeReference.match(words) ?? []).map(token => [token.toLowerCase(), token]));
  const lowerConnectors = [...canonical.values()].some(token => smallWords.has(token));
  if (title) {
    let index = 0;
    return value.replace(words, word => {
      const lower = word.toLowerCase();
      const first = index++ === 0;
      if (acronyms.has(word.toUpperCase())) return word.toUpperCase();
      const saved = canonical.get(lower);
      if (saved && saved !== saved.toLowerCase()) return saved;
      if (!first && smallWords.has(lower) && lowerConnectors) return lower;
      return titleWord(word);
    });
  }
  // Sentence-style blocks remain sentence case even when entered in all caps.
  const sentence = value.toLowerCase().replace(/(^|[.!?]\s+)([^\p{L}]*)(\p{L})/gu, (_, start, prefix, letter) => start + prefix + letter.toUpperCase());
  return sentence.replace(words, word => {
    const saved = canonical.get(word.toLowerCase());
    return acronyms.has(word.toUpperCase()) ? word.toUpperCase() : saved && saved.length > 1 && saved === saved.toUpperCase() ? saved : word;
  });
}

/** The input year is calendar metadata, never additional flyer copy. */
export function cocoDisplayDate(value: string) {
  return value.replace(/\b\d{4}\b/g, '').split('\n')
    .map(line => line.replace(/^[\s,./|:;–—-]+|[\s,./|:;–—-]+$/g, '').replace(/[ \t]{2,}/g, ' '))
    .filter(Boolean).join('\n');
}

export function authoredStackedDate(authored: string, fallback: string, date: { day: string; month: string; weekday: string }) {
  fallback = cocoDisplayDate(fallback);
  if (!fallback || !authored.includes('\n') || !date.day || !date.month) return fallback;
  const weekdays = /^(sun(day)?|mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?)$/i;
  const months = /^(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(tember)?|oct(ober)?|nov(ember)?|dec(ember)?)$/i;
  const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const fullWeekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const lines = authored.split('\n').map(line => {
    const token = line.trim();
    if (weekdays.test(token)) return token.length > 3 ? fullWeekdays.find(d => d.slice(0,3).toLowerCase() === date.weekday.slice(0,3).toLowerCase()) ?? date.weekday : date.weekday.slice(0,3);
    if (months.test(token)) {
      const full = fullMonths.find(m => m.slice(0,3).toLowerCase() === date.month.slice(0,3).toLowerCase()) ?? date.month;
      // A short month column must not turn September/December into overflow.
      return token.length > 3 && full.length <= token.length ? full : date.month.slice(0,3);
    }
    if (/^\d{1,2}$/.test(token)) return token.startsWith('0') ? date.day.padStart(2, '0') : date.day;
    if (/^\d{4}$/.test(token)) return '';
    return null;
  });
  return lines.some(line => line === null) ? fallback : lines.filter(Boolean).join('\n');
}

/** A time value replaces the time, not an authored “Doors Open” label. */
export function authoredTime(authored: string, value: string) {
  if (!value) return '';
  const match = authored.match(/^([\s\S]*?)(?:\d{1,2}(?::\d{2})?\s*[ap]m)/i);
  const prefix = match?.[1] ?? '';
  return /\b(doors|open|starts?|from|boarding)\b/i.test(prefix) && !/\b(doors|open|starts?|from|boarding)\b/i.test(value) ? prefix + value : value;
}
