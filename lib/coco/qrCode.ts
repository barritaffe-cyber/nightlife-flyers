import qrcode from 'qrcode-generator';
import type { CocoEventBriefInput } from './eventBriefFields.ts';

const cache = new Map<string, { url: string; modules: number; destination: string }>();
qrcode.stringToBytes = (text: string) => Array.from(new TextEncoder().encode(text));

/** Generate locally: links and contact details never go to a QR service. */
export function cocoQrCode(brief: CocoEventBriefInput) {
  const requested = String(brief.qrDestination || brief.ticketLink || (/^https?:\/\//i.test(brief.rsvpContact ?? '') ? brief.rsvpContact : '') || '').trim();
  if (!requested) return null;
  let destination: string;
  try {
    const link = new URL(/^https?:\/\//i.test(requested) ? requested : `https://${requested}`);
    if (!['https:', 'http:'].includes(link.protocol) || !link.hostname.includes('.') || /\s/.test(requested) || /^[a-z]+:/i.test(requested) && !/^https?:/i.test(requested)) throw new Error();
    destination = link.href;
  } catch { return { error: 'Enter a complete website link for the QR code, such as https://example.com/tickets.' }; }
  if (cache.has(destination)) return cache.get(destination)!;
  try {
    const code = qrcode(0, 'M');
    code.addData(destination, 'Byte');
    code.make();
    const modules = code.getModuleCount(), size = modules + 8;
    let path = '';
    for (let y = 0; y < modules; y++) for (let x = 0; x < modules; x++) if (code.isDark(y, x)) path += `M${x + 4} ${y + 4}h1v1h-1z`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 8}" height="${size * 8}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><path fill="#fff" d="M0 0h${size}v${size}H0z"/><path fill="#000" d="${path}"/></svg>`;
    const result = { destination, modules, url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` };
    if (cache.size >= 24) cache.delete(cache.keys().next().value!);
    cache.set(destination, result);
    return result;
  } catch { return { error: 'This QR link is too long. Use a shorter ticket or RSVP link.' }; }
}
