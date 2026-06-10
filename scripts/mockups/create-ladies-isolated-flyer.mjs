import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const W = 1080;
const H = 1920;
const source = "/Users/thepartyrocker/Documents/DJ47/GRAPHIX/Magaritaville/LN-CL2.jpg";
const out = path.join(root, "public/mockups/ladies-night-isolated-icons.png");

const font = (name) => `file://${path.join(root, "public/fonts", name)}`;

const fontCss = `
@font-face { font-family: BebasLocal; src: url("${font("BebasNeue-Regular.ttf")}"); }
@font-face { font-family: LemonLocal; src: url("${font("LEMONMILK-Bold.ttf")}"); }
@font-face { font-family: ScriptLocal; src: url("${font("dear-script-demo-font.ttf")}"); }
@font-face { font-family: CoolLocal; src: url("${font("Coolvetica-Hv-Comp.ttf")}"); }
`;

const svgBuffer = (body) => Buffer.from(body);

const appIcons = {
  instagram: {
    mode: "stroke",
    paths: [
      "M38 16H90C106 16 112 22 112 38V90C112 106 106 112 90 112H38C22 112 16 106 16 90V38C16 22 22 16 38 16Z",
      "M64 42A22 22 0 1 0 64 86A22 22 0 0 0 64 42Z",
      "M90 32A4.5 4.5 0 1 0 89.99 32Z",
    ],
  },
  tiktok: {
    mode: "fill",
    paths: [
      "M27.396,80.812c0.276-1.683,0.394-3.407,0.85-5.04c3.04-10.924,10.19-17.529,21.236-19.938c2.741-0.599,5.52-0.61,8.302-0.293 c0.246,0.027,0.486,0.107,0.753,0.169c0,4.726,0,9.413,0,14.181c-0.821-0.145-1.6-0.311-2.388-0.418c-6.767-0.921-13.138,3.772-14.228,10.477 c-1.102,6.767,3.33,13.203,10.033,14.56c7.837,1.588,15.156-4.181,15.271-12.175c0.11-7.366,0.047-14.735,0.05-22.101 c0.006-12.204,0-24.409,0-36.61c0-0.356,0-0.711,0-1.111c4.747,0,9.375,0,13.92,0c1.517,13.173,8.788,20.403,22.027,21.76 c0,4.513,0,9.132,0,13.849c-8.05-0.05-15.236-2.507-21.819-7.387c0,0.456,0,0.767,0,1.081c0.036,9.899,0.083,19.796,0.107,29.695 c0.03,12.886-8.281,23.493-20.803,26.53c-1.301,0.317-2.655,0.415-3.985,0.619c-0.273,0.041-0.542,0.107-0.815,0.163c-0.957,0-1.911,0-2.868,0 c-1.159-0.169-2.323-0.317-3.479-0.51c-10.465-1.751-19.227-10.104-21.467-20.501c-0.317-1.47-0.471-2.978-0.699-4.465 C27.396,82.498,27.396,81.656,27.396,80.812z",
    ],
  },
  whatsapp: {
    mode: "fill",
    paths: [
      "M65.126,27.68c1.434,0,2.865,0,4.299,0c0.172,0.039,0.341,0.092,0.516,0.116c1.022,0.139,2.056,0.216,3.07,0.418 c7.413,1.461,13.476,5.179,18.193,11.067c3.425,4.279,5.556,9.141,6.293,14.587c0.142,1.058,0.237,2.124,0.353,3.185c0,0.637,0,1.274,0,1.911 c-0.039,0.255-0.083,0.507-0.113,0.761c-0.175,1.399-0.252,2.815-0.53,4.193c-2.667,13.212-14.074,23.283-27.479,24.276 c-5.502,0.409-10.759-0.551-15.748-2.936c-0.279-0.133-0.658-0.181-0.957-0.116c-4.471,1.001-8.936,2.03-13.401,3.049 c-0.916,0.207-1.831,0.406-2.791,0.616c0.024-0.204,0.024-0.326,0.05-0.439c1.132-5.135,2.264-10.267,3.41-15.399c0.107-0.474,0.047-0.856-0.175-1.292 c-3.455-6.788-4.326-13.881-2.441-21.283c2.883-11.316,12.658-20.311,24.163-22.24C62.927,27.973,64.03,27.837,65.126,27.68z M43.099,82.45 c0.264-0.044,0.436-0.068,0.604-0.104c3.327-0.753,6.655-1.52,9.988-2.249c0.308-0.068,0.714-0.006,0.993,0.142 c6.797,3.633,13.846,4.237,21.144,1.781c11.81-3.976,19.079-16.45,16.738-28.696c-2.761-14.444-17.327-23.739-31.6-20.068 c-8.124,2.089-13.953,7.055-17.384,14.711c-1.97,4.397-2.545,9.028-1.775,13.813c0.53,3.298,1.71,6.35,3.372,9.233 c0.16,0.279,0.261,0.684,0.199,0.99c-0.507,2.427-1.061,4.844-1.597,7.268C43.553,80.305,43.336,81.345,43.099,82.45z",
      "M58.361,44.646c1.247-0.308,1.884,0.447,2.326,1.564c0.64,1.624,1.319,3.236,1.994,4.844c0.19,0.453,0.249,0.901-0.047,1.304 c-0.521,0.717-1.055,1.434-1.636,2.101c-0.652,0.75-0.696,0.927-0.187,1.772c2.243,3.736,5.36,6.456,9.404,8.107c0.729,0.296,1.055,0.246,1.567-0.367 c0.702-0.839,1.384-1.692,2.065-2.548c0.489-0.613,0.77-0.764,1.487-0.436c1.982,0.91,3.947,1.861,5.89,2.85c0.243,0.124,0.459,0.581,0.453,0.88 c-0.036,1.879-0.542,3.523-2.201,4.699c-2.213,1.57-4.554,1.68-7.096,1.064c-6.859-1.656-11.935-5.73-15.873-11.428 c-1.271-1.84-2.51-3.686-2.993-5.908c-0.667-3.064,0.127-5.698,2.421-7.861C56.596,44.661,57.407,44.554,58.361,44.646z",
    ],
  },
};

const iconSvg = (name, x, y, size) => {
  const icon = appIcons[name];
  const scale = size / 128;
  const attrs =
    icon.mode === "fill"
      ? `fill="#f7fbff" stroke="none"`
      : `fill="none" stroke="#f7fbff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"`;
  return `<g transform="translate(${x} ${y}) scale(${scale})" ${attrs}>${icon.paths
    .map((d) => `<path d="${d}"/>`)
    .join("")}</g>`;
};

async function coverBuffer() {
  return sharp(source)
    .resize(W, H, { fit: "cover", position: "center" })
    .png()
    .toBuffer();
}

async function subjectMask() {
  const mask = svgBuffer(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <g fill="#fff">
        <path d="M528 150C420 152 346 226 338 365C330 495 374 615 438 700C482 748 616 748 680 704C750 656 792 530 778 388C762 224 666 146 528 150Z"/>
        <path d="M244 628C340 574 742 570 854 636C956 758 1032 1030 1080 1284V1920H90C132 1580 174 930 244 628Z"/>
        <path d="M330 632C254 740 220 960 188 1222C160 1454 132 1680 96 1920H292C324 1584 346 1232 426 804C392 738 360 684 330 632Z"/>
        <path d="M754 632C900 768 1018 1084 1080 1318V1920H884C910 1484 878 1152 778 816C760 752 752 696 754 632Z"/>
      </g>
    </svg>
  `);
  return sharp(mask).blur(1.4).png().toBuffer();
}

async function subjectLayer(base, mask) {
  return sharp(base)
    .modulate({ brightness: 1.04, saturation: 1.08 })
    .sharpen({ sigma: 0.65, m1: 0.7, m2: 1.4 })
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function maskGlow(mask) {
  return sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 128, g: 232, b: 219, alpha: 0.32 },
    },
  })
    .composite([{ input: mask, blend: "dest-in" }])
    .blur(9)
    .png()
    .toBuffer();
}

function gradeSvg() {
  return svgBuffer(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <radialGradient id="cyan" cx="52%" cy="38%" r="58%">
        <stop offset="0" stop-color="#76fff1" stop-opacity=".22"/>
        <stop offset=".42" stop-color="#7b3df2" stop-opacity=".18"/>
        <stop offset="1" stop-color="#02010a" stop-opacity=".92"/>
      </radialGradient>
      <radialGradient id="pink" cx="74%" cy="28%" r="38%">
        <stop offset="0" stop-color="#ff44b7" stop-opacity=".36"/>
        <stop offset=".48" stop-color="#9c1fc9" stop-opacity=".14"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="blackFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#03020b" stop-opacity=".38"/>
        <stop offset=".34" stop-color="#05020f" stop-opacity=".08"/>
        <stop offset=".74" stop-color="#020107" stop-opacity=".40"/>
        <stop offset="1" stop-color="#000" stop-opacity=".94"/>
      </linearGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="table" tableValues="0 .085"/></feComponentTransfer>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#cyan)"/>
    <rect width="${W}" height="${H}" fill="url(#pink)"/>
    <rect width="${W}" height="${H}" fill="url(#blackFade)"/>
    <rect width="${W}" height="${H}" filter="url(#grain)" opacity=".42"/>
    <rect x="36" y="34" width="${W - 72}" height="${H - 68}" fill="none" stroke="#ffffff" stroke-opacity=".10" stroke-width="1"/>
  </svg>`);
}

function behindTypeSvg() {
  return svgBuffer(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <style>${fontCss}</style>
    <defs>
      <filter id="softBlur"><feGaussianBlur stdDeviation="2.6"/></filter>
      <linearGradient id="ghost" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#59fff2" stop-opacity=".10"/>
        <stop offset=".5" stop-color="#ffffff" stop-opacity=".24"/>
        <stop offset="1" stop-color="#ff45be" stop-opacity=".10"/>
      </linearGradient>
    </defs>
    <g font-family="BebasLocal, Impact, sans-serif" text-anchor="middle" letter-spacing="10">
      <text x="540" y="790" font-size="240" fill="none" stroke="url(#ghost)" stroke-width="3" opacity=".84" filter="url(#softBlur)">LADIES</text>
      <text x="540" y="1028" font-size="252" fill="none" stroke="#ffffff" stroke-width="2.5" opacity=".13">NIGHT</text>
      <text x="540" y="1218" font-size="118" fill="#ffffff" opacity=".055">LADIES NIGHT LADIES NIGHT</text>
    </g>
  </svg>`);
}

function behindMainSvg() {
  return svgBuffer(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <style>${fontCss}</style>
    <defs>
      <linearGradient id="titleWhite" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset=".45" stop-color="#f8fbff"/>
        <stop offset="1" stop-color="#c7f9ff"/>
      </linearGradient>
      <linearGradient id="scriptGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff3b8"/>
        <stop offset=".38" stop-color="#ffd46d"/>
        <stop offset=".72" stop-color="#f14baa"/>
        <stop offset="1" stop-color="#ffffff"/>
      </linearGradient>
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="7" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="tightShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#050012" flood-opacity=".9"/>
      </filter>
    </defs>
    <g text-anchor="middle" filter="url(#tightShadow)">
      <text x="540" y="252" font-family="BebasLocal, Impact, sans-serif" font-size="184" letter-spacing="8" fill="url(#titleWhite)" stroke="#28043f" stroke-width="4">LADIES</text>
      <text x="540" y="352" font-family="ScriptLocal, Brush Script MT, cursive" font-size="152" fill="url(#scriptGold)" stroke="#180019" stroke-width="2" filter="url(#glow)">Night</text>
    </g>
    <g font-family="LemonLocal, Arial, sans-serif" fill="#f7fbff">
      <text x="106" y="552" font-size="38" letter-spacing="1">FRI 17</text>
      <text x="105" y="591" font-size="25" letter-spacing="5" opacity=".82">MAY</text>
      <line x1="248" y1="571" x2="748" y2="571" stroke="#ffffff" stroke-opacity=".32" stroke-width="1"/>
      <text x="784" y="579" font-size="42" letter-spacing="1">9:00PM +</text>
    </g>
  </svg>`);
}

function topAndForegroundSvg() {
  return svgBuffer(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <style>${fontCss}</style>
    <g text-anchor="middle">
      <text x="540" y="70" font-family="LemonLocal, Arial, sans-serif" font-size="20" letter-spacing="7" fill="#e7f9ff" opacity=".92">MARGARITAVILLE</text>
      <text x="540" y="103" font-family="LemonLocal, Arial, sans-serif" font-size="28" letter-spacing="3" fill="#ffffff">PRESENTS</text>
      <line x1="348" y1="126" x2="732" y2="126" stroke="#d6fff9" stroke-opacity=".28" stroke-width="1"/>
      <text x="540" y="774" font-family="ScriptLocal, Brush Script MT, cursive" font-size="150" fill="#ffd56d" stroke="#190018" stroke-width="2">Night</text>
      <text x="540" y="824" font-family="LemonLocal, Arial, sans-serif" font-size="23" letter-spacing="8" fill="#d9fff8" opacity=".78">COCKTAILS  |  DANCEHALL  |  AFROBEATS</text>
    </g>

    <g text-anchor="middle" font-family="LemonLocal, Arial, sans-serif">
      <text x="540" y="1398" font-size="23" letter-spacing="8" fill="#e8fff9" opacity=".86">FEATURING</text>
      <text x="540" y="1452" font-size="54" letter-spacing="4" fill="#ffffff">DJ NUKILH</text>
      <rect x="150" y="1505" width="780" height="58" rx="29" fill="none" stroke="#ffffff" stroke-opacity=".62" stroke-width="1.4"/>
      <text x="540" y="1544" font-size="28" letter-spacing="2.5" fill="#fff6ca">3 COMPLIMENTARY DRINKS FOR LADIES</text>
      <text x="540" y="1619" font-size="25" letter-spacing="2" fill="#ffffff">RSVP: 876 555 0199  |  TABLES: 876 555 0127</text>
      <text x="540" y="1665" font-size="18" letter-spacing="7" fill="#ccfff8" opacity=".80">FOLLOW THE NIGHT</text>
    </g>

    <g opacity=".96">
      ${iconSvg("instagram", 447, 1686, 42)}
      ${iconSvg("tiktok", 519, 1686, 42)}
      ${iconSvg("whatsapp", 591, 1686, 42)}
    </g>

    <g text-anchor="middle" font-family="LemonLocal, Arial, sans-serif">
      <text x="540" y="1760" font-size="22" letter-spacing="4" fill="#ffffff">@MARGARITAVILLE</text>
      <text x="540" y="1826" font-size="34" letter-spacing="3" fill="#ffffff">MARGARITAVILLE - MONTEGO BAY</text>
      <text x="540" y="1868" font-size="21" letter-spacing="2" fill="#e6dcff" opacity=".84">FREE ENTRY BEFORE 10PM WITH RSVP</text>
    </g>
  </svg>`);
}

function foregroundCurveSvg() {
  return svgBuffer(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <filter id="soft"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>
    <g fill="none" stroke-linecap="round" filter="url(#soft)" opacity=".62">
      <path d="M-60 1350C220 1190 318 1320 512 1190C748 1032 872 1120 1140 940" stroke="#4effee" stroke-width="3" stroke-opacity=".7"/>
      <path d="M-80 1240C170 1044 352 1160 520 1008C740 810 882 838 1160 650" stroke="#c75cff" stroke-width="2" stroke-opacity=".64"/>
    </g>
  </svg>`);
}

const base = await coverBuffer();
const mask = await subjectMask();
const cutout = await subjectLayer(base, mask);
const glow = await maskGlow(mask);

const background = await sharp(base)
  .blur(2.2)
  .modulate({ brightness: 0.64, saturation: 1.1 })
  .linear(1.02, -8)
  .png()
  .toBuffer();

const laser = await sharp(path.join(root, "public/scene-assets/neon-club/laser-beams.svg"))
  .resize(W, H, { fit: "fill" })
  .png()
  .toBuffer();
const smoke = await sharp(path.join(root, "public/scene-assets/common/smoke-ribbons.svg"))
  .resize(W, H, { fit: "fill" })
  .png()
  .toBuffer();

await fs.mkdir(path.dirname(out), { recursive: true });

await sharp(background)
  .composite([
    { input: gradeSvg(), blend: "overlay" },
    { input: laser, blend: "screen" },
    { input: smoke, blend: "screen" },
    { input: behindTypeSvg(), blend: "screen" },
    { input: behindMainSvg(), blend: "over" },
    { input: glow, blend: "screen" },
    { input: cutout, blend: "over" },
    { input: foregroundCurveSvg(), blend: "screen" },
    { input: topAndForegroundSvg(), blend: "over" },
  ])
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(out);

console.log(out);
