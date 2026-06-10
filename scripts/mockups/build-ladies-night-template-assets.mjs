import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source =
  process.env.LADIES_NIGHT_SOURCE ||
  "/Users/thepartyrocker/Documents/DJ47/GRAPHIX/Magaritaville/LN-CL2.jpg";
const outDir = path.join(root, "public/scene-assets/ladies-night");

async function makeMask(width, height, variant) {
  const body =
    variant === "story"
      ? `
        <path d="M528 150C420 152 346 226 338 365C330 495 374 615 438 700C482 748 616 748 680 704C750 656 792 530 778 388C762 224 666 146 528 150Z"/>
        <path d="M244 628C340 574 742 570 854 636C956 758 1032 1030 1080 1284V1920H90C132 1580 174 930 244 628Z"/>
        <path d="M330 632C254 740 220 960 188 1222C160 1454 132 1680 96 1920H292C324 1584 346 1232 426 804C392 738 360 684 330 632Z"/>
        <path d="M754 632C900 768 1018 1084 1080 1318V1920H884C910 1484 878 1152 778 816C760 752 752 696 754 632Z"/>
      `
      : `
        <path d="M528 88C414 92 334 170 322 300C310 424 354 536 432 600C492 650 620 650 690 602C768 548 800 426 786 302C770 172 666 84 528 88Z"/>
        <path d="M214 506C330 450 758 448 884 510C984 636 1038 820 1080 1080H0C52 830 112 628 214 506Z"/>
        <path d="M310 508C222 620 172 804 126 1080H326C344 820 374 660 438 600C388 566 348 536 310 508Z"/>
        <path d="M758 508C884 620 1012 842 1080 1080H858C866 820 834 654 760 600C758 566 756 536 758 508Z"/>
      `;

  return sharp(
    Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <g fill="#fff">${body}</g>
      </svg>
    `)
  )
    .blur(1.4)
    .png()
    .toBuffer();
}

async function writeVariant(variant, width, height) {
  const base = await sharp(source)
    .resize(width, height, { fit: "cover", position: "center" })
    .modulate({ brightness: 0.96, saturation: 1.06 })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
  const mask = await makeMask(width, height, variant);
  const subject = await sharp(base)
    .modulate({ brightness: 1.04, saturation: 1.08 })
    .sharpen({ sigma: 0.65, m1: 0.7, m2: 1.4 })
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  await fs.writeFile(path.join(outDir, `background-${variant}.jpg`), base);
  await fs.writeFile(path.join(outDir, `subject-${variant}.png`), subject);
}

await fs.mkdir(outDir, { recursive: true });
await writeVariant("story", 1080, 1920);
await writeVariant("square", 1080, 1080);

console.log(outDir);
