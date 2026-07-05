import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const outDir = path.join(root, 'public', 'ads', 'premium-commercial');
const frameDir = path.join(outDir, 'frames');

const W = Number(process.env.AD_W || 1080);
const H = Number(process.env.AD_H || 1920);
const FPS = Number(process.env.AD_FPS || 24);
const DURATION = 20;
const FRAMES = FPS * DURATION;

const assetNames = {
  logo: 'puzzle-market-cube-logo.png',
  jewelry1: 'photo_2026-06-26_21-10-42.jpg',
  jewelry2: 'photo_2026-06-26_21-10-46.jpg',
  jewelry3: 'photo_2026-06-26_21-10-50.jpg',
  jewelry4: 'photo_2026-06-26_21-10-53.jpg',
  textile1: 'photo_2026-06-26_21-11-16.jpg',
  textile2: 'photo_2026-06-26_21-11-35.jpg',
  textile3: 'ads/premium-archive-puzzle-art.jpg'
};

const assets = {};

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  })[char]);
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function ease(t) {
  t = clamp(t);
  return t < 0.5 ? 4 * t ** 3 : 1 - ((-2 * t + 2) ** 3) / 2;
}

function fade(t, a, b, edge = 0.45) {
  return clamp(Math.min((t - a) / edge, (b - t) / edge));
}

function scene(t, a, b) {
  return clamp((t - a) / (b - a));
}

function money(t) {
  const values = ['$29', '$189', '$420', '$790'];
  return values[Math.min(3, Math.floor(scene(t, 6, 10) * 4.2))];
}

async function dataUri(name) {
  const ext = path.extname(name).slice(1).replace('jpg', 'jpeg');
  const data = await fs.readFile(path.join(publicDir, name));
  return `data:image/${ext};base64,${data.toString('base64')}`;
}

async function ensureArchivePuzzleArt() {
  const file = path.join(publicDir, assetNames.textile3);
  await fs.mkdir(path.dirname(file), { recursive: true });

  const W2 = 1600;
  const H2 = 1000;
  const pieces = [];
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 16; x++) {
      const px = x * 100;
      const py = y * 100;
      const hue = 198 + ((x + y) % 5) * 7;
      const alpha = 0.1 + ((x * 3 + y * 5) % 4) * 0.035;
      pieces.push(`<path d="M${px},${py} h100 v100 h-100 z" fill="hsla(${hue},82%,50%,${alpha})" stroke="rgba(255,255,255,.13)" stroke-width="2"/>`);
      if ((x + y) % 3 === 0) {
        pieces.push(`<circle cx="${px + 100}" cy="${py + 50}" r="16" fill="rgba(245,195,74,.25)" stroke="rgba(255,255,255,.14)" stroke-width="2"/>`);
      }
    }
  }

  const svgArt = `<svg xmlns="http://www.w3.org/2000/svg" width="${W2}" height="${H2}" viewBox="0 0 ${W2} ${H2}">
    <defs>
      <radialGradient id="sky" cx="50%" cy="38%" r="70%">
        <stop offset="0%" stop-color="#245f86"/>
        <stop offset="45%" stop-color="#0c2437"/>
        <stop offset="100%" stop-color="#05080d"/>
      </radialGradient>
      <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#806025"/>
        <stop offset="45%" stop-color="#f6d379"/>
        <stop offset="100%" stop-color="#7a551e"/>
      </linearGradient>
      <linearGradient id="mountain" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f3cc71"/>
        <stop offset="100%" stop-color="#7f5a22"/>
      </linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="18" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="${W2}" height="${H2}" fill="url(#sky)"/>
    <circle cx="790" cy="390" r="210" fill="rgba(246,211,121,.16)" filter="url(#glow)"/>
    <path d="M0 700 C220 570 315 610 455 470 C585 340 690 445 790 330 C930 170 1045 420 1150 350 C1290 255 1395 440 1600 305 V1000 H0 Z" fill="rgba(5,8,13,.55)"/>
    <path d="M0 760 C210 610 330 650 485 505 C610 390 710 495 815 370 C930 235 1015 455 1168 386 C1325 315 1420 482 1600 365 V1000 H0 Z" fill="url(#mountain)" opacity=".82"/>
    <path d="M0 785 C235 635 344 675 498 535 C632 410 725 520 835 405 C955 285 1040 490 1180 420 C1350 350 1435 520 1600 405" fill="none" stroke="rgba(255,255,255,.46)" stroke-width="6"/>
    <g opacity=".72">${pieces.join('')}</g>
    <rect x="58" y="58" width="1484" height="884" rx="42" fill="none" stroke="url(#goldLine)" stroke-width="18"/>
    <rect x="92" y="92" width="1416" height="816" rx="26" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="4"/>
    <path d="M190 210 C310 125 405 165 505 235 C615 315 710 135 805 210 C930 310 1015 175 1130 210 C1265 250 1332 180 1412 132" fill="none" stroke="rgba(21,200,230,.38)" stroke-width="8"/>
    <path d="M230 795 C370 710 490 805 625 725 C785 630 875 780 1010 690 C1145 600 1300 700 1425 620" fill="none" stroke="rgba(246,211,121,.5)" stroke-width="8"/>
    <rect width="${W2}" height="${H2}" fill="rgba(0,0,0,.08)"/>
  </svg>`;

  await sharp(Buffer.from(svgArt)).jpeg({ quality: 92, mozjpeg: true }).toFile(file);
}

function image(id, x, y, w, h, opacity = 1) {
  return `<image href="${assets[id]}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" opacity="${opacity}"/>`;
}

function text(value, x, y, size, weight = 800, color = '#fff', anchor = 'middle', opacity = 1, extra = '') {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" opacity="${opacity}" ${extra}>${esc(value)}</text>`;
}

function box(cx, cy, scale, rot = 0, label = 'ARCHIVE') {
  const bw = 470 * scale;
  const bh = 560 * scale;
  const x = cx - bw / 2;
  const y = cy - bh / 2;
  const imagePad = 42 * scale;
  return `
    <g transform="rotate(${rot} ${cx} ${cy})">
      <ellipse cx="${cx}" cy="${cy + bh * 0.58}" rx="${bw * 0.54}" ry="${bh * 0.09}" fill="rgba(0,0,0,.55)" filter="url(#softBlur)"/>
      <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${34 * scale}" fill="url(#boxGrad)" stroke="rgba(255,255,255,.2)" stroke-width="${4 * scale}"/>
      <rect x="${x + imagePad}" y="${y + imagePad}" width="${bw - imagePad * 2}" height="${bh * 0.56}" rx="${20 * scale}" fill="#101821"/>
      <clipPath id="clip-${Math.round(cx)}-${Math.round(cy)}"><rect x="${x + imagePad}" y="${y + imagePad}" width="${bw - imagePad * 2}" height="${bh * 0.56}" rx="${20 * scale}"/></clipPath>
      <g clip-path="url(#clip-${Math.round(cx)}-${Math.round(cy)})">${image('textile3', x + imagePad, y + imagePad, bw - imagePad * 2, bh * 0.56)}</g>
      <rect x="${x + imagePad}" y="${y + imagePad}" width="${bw - imagePad * 2}" height="${bh * 0.56}" rx="${20 * scale}" fill="url(#sheen)" opacity=".52"/>
      ${text(label, cx, y + bh * 0.78, 42 * scale, 950)}
      ${text('LIMITED SERIES', cx, y + bh * 0.86, 18 * scale, 850, '#15c8e6')}
    </g>`;
}

function priceTag(x, y, value, opacity = 1) {
  return `<g opacity="${opacity}">
    <rect x="${x}" y="${y}" width="${210}" height="${74}" rx="14" fill="url(#gold)" filter="url(#goldGlow)"/>
    ${text(value, x + 105, y + 50, 34, 950, '#050505')}
  </g>`;
}

function sceneOne(t) {
  const st = scene(t, 0, 3);
  return `
    ${box(W / 2, H * 0.38 + Math.sin(st * Math.PI) * 18, 1.0 + st * 0.05, -5 + st * 10)}
    ${priceTag(W / 2 - 105, H * 0.65, '$29.99', fade(t, .2, 2.85))}
    <g opacity="${fade(t, .65, 2.9)}">
      ${text('What if this', W / 2, H * 0.79, 58, 950)}
      ${text("wasn't just a puzzle?", W / 2, H * 0.85, 58, 950)}
    </g>`;
}

function sceneTwo(t) {
  const st = scene(t, 3, 6);
  const pages = Array.from({ length: 8 }, (_, i) => {
    const x = W * (0.12 + i * 0.1) + Math.sin(st * 20 + i) * 20;
    const y = H * 0.13 + ((st * 1300 + i * 150) % (H * 0.52));
    return `<g transform="rotate(${Math.sin(st * 12 + i) * 12} ${x} ${y})" opacity=".7">
      <rect x="${x - 44}" y="${y - 58}" width="88" height="116" fill="${i % 2 ? '#f4ebcf' : '#e6d4a8'}"/>
      <line x1="${x - 32}" y1="${y - 22}" x2="${x + 32}" y2="${y - 22}" stroke="rgba(0,0,0,.28)" stroke-width="3"/>
    </g>`;
  }).join('');
  return `
    <rect x="${W * .12}" y="${H * .59}" width="${W * .76}" height="26" fill="#6c4527"/>
    ${pages}
    ${box(W / 2, H * 0.43, .72, 2)}
    <g opacity="${fade(t, 3.2, 5.9)}">${text('Years later...', W / 2, H * 0.82, 64, 950)}</g>`;
}

function sceneThree(t) {
  const st = scene(t, 6, 10);
  const prices = ['$29', '$189', '$420', '$790'];
  const lines = Array.from({ length: 13 }, (_, i) => `<line x1="${W * .14}" y1="${H * (.16 + i * .055)}" x2="${W * .86}" y2="${H * (.16 + i * .055) + Math.sin(st * 8 + i) * 4}" stroke="${i % 3 === 0 ? 'rgba(21,200,230,.28)' : 'rgba(255,255,255,.1)'}" stroke-width="2"/>`).join('');
  const priceRows = prices.map((p, i) => {
    const y = H * 0.59 + i * H * 0.072;
    const active = p === money(t);
    const op = ease((st - i * .18) / .16);
    return `<g opacity="${op}">
      ${text(p, W / 2, y, active ? 70 : 44, 950, active ? '#16f58a' : 'rgba(255,255,255,.55)')}
      ${i < 3 ? text('↓', W / 2, y + H * .036, 34, 700, 'rgba(255,255,255,.32)') : ''}
    </g>`;
  }).join('');
  return `
    ${lines}
    ${box(W / 2, H * 0.36, .82, Math.sin(st * Math.PI) * 5)}
    ${priceRows}
    ${text('Illustrative example. Values vary depending on rarity and demand.', W / 2, H * .94, 24, 650, 'rgba(255,255,255,.72)', 'middle', fade(t, 6.1, 9.8))}`;
}

function sceneFour(t) {
  const st = scene(t, 10, 15);
  const ids = ['jewelry1', 'jewelry2', 'jewelry3', 'jewelry4', 'textile1', 'textile2', 'textile3'];
  const cards = ids.map((id, i) => {
    const p = (st * 1.2 + i / ids.length) % 1;
    const w = W * .52;
    const h = H * .15;
    const x = W * .98 - p * W * 1.5;
    const y = H * (.14 + (i % 4) * .15);
    return `<g transform="rotate(${(i % 2 ? -2.5 : 2.5)} ${x + w / 2} ${y + h / 2})">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="#111" filter="url(#cardShadow)"/>
      <clipPath id="m${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22"/></clipPath>
      <g clip-path="url(#m${i})">${image(id, x, y, w, h)}</g>
    </g>`;
  }).join('');
  return `
    ${cards}
    <rect x="0" y="${H * .54}" width="${W}" height="${H * .46}" fill="url(#blackFade)"/>
    <g opacity="${fade(t, 10.25, 14.85)}">
      ${text('Some puzzles', W / 2, H * .77, 60, 950)}
      ${text('become collectibles.', W / 2, H * .835, 60, 950)}
    </g>`;
}

function sceneFive(t) {
  const st = scene(t, 15, 18);
  const x = W * .15;
  const y = H * .11 + Math.sin(st * Math.PI) * 10;
  const w = W * .7;
  const h = H * .76;
  const cardIds = ['jewelry1', 'jewelry2', 'jewelry3'];
  const cards = cardIds.map((id, i) => {
    const yy = y + h * .26 + i * h * .19 - ease(st) * 36;
    return `<g>
      <rect x="${x + 42}" y="${yy}" width="${w - 84}" height="${h * .15}" rx="18" fill="rgba(255,255,255,.065)"/>
      <clipPath id="phoneCard${i}"><rect x="${x + 60}" y="${yy + 18}" width="${w * .28}" height="${h * .105}" rx="12"/></clipPath>
      <g clip-path="url(#phoneCard${i})">${image(id, x + 60, yy + 18, w * .28, h * .105)}</g>
      ${text(['Emerald Collector Set','Ruby Archive Edition','Golden Heirloom Puzzle'][i], x + w * .45, yy + 54, 23, 900, '#fff', 'start')}
      ${text(['Rare','Vintage','Limited'][i], x + w * .45, yy + 92, 18, 850, '#15c8e6', 'start')}
      ${text(['$189','$420','$790'][i], x + w * .45, yy + 134, 27, 950, '#16f58a', 'start')}
    </g>`;
  }).join('');
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="48" fill="#05080c" stroke="rgba(255,255,255,.18)" stroke-width="5" filter="url(#cyanGlow)"/>
    <rect x="${x + 30}" y="${y + 30}" width="${w - 60}" height="${h - 60}" rx="28" fill="#0b1016"/>
    ${image('logo', x + 58, y + 54, 78, 78)}
    ${text('Puzzle Market', x + 152, y + 106, 31, 950, '#fff', 'start')}
    ${text('Premium collectible marketplace', x + 152, y + 143, 16, 650, 'rgba(255,255,255,.58)', 'start')}
    ${cards}
    ${text('Search. Buy. Save.', W / 2, H * .92, 40, 900, '#fff', 'middle', fade(t, 15.2, 17.9))}`;
}

function sceneSix(t) {
  return `
    <g opacity="${ease(scene(t, 18, 18.4))}">${image('logo', W / 2 - 120, H * .19, 240, 240)}</g>
    <g opacity="${ease(scene(t, 18.15, 18.75))}">
      ${text('Puzzle Market', W / 2, H * .45, 72, 950)}
      ${text('www.puzzle-market.com', W / 2, H * .515, 36, 850, '#15c8e6')}
    </g>
    <g opacity="${ease(scene(t, 18.45, 19.05))}">
      ${text("Discover Tomorrow's", W / 2, H * .66, 56, 950)}
      ${text('Collectibles.', W / 2, H * .72, 56, 950)}
    </g>
    ${text('Buy • Sell • Collect', W / 2, H * .84, 30, 800, 'rgba(255,255,255,.72)', 'middle', ease(scene(t, 18.85, 19.35)))}`;
}

function svg(t) {
  let content = '';
  if (t < 3) content = sceneOne(t);
  else if (t < 6) content = sceneTwo(t);
  else if (t < 10) content = sceneThree(t);
  else if (t < 15) content = sceneFour(t);
  else if (t < 18) content = sceneFive(t);
  else content = sceneSix(t);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <radialGradient id="bg" cx="52%" cy="36%" r="72%">
        <stop offset="0%" stop-color="#13222d"/>
        <stop offset="43%" stop-color="#05070a"/>
        <stop offset="100%" stop-color="#000"/>
      </radialGradient>
      <radialGradient id="warmGlow" cx="52%" cy="34%" r="48%">
        <stop offset="0%" stop-color="rgba(244,190,91,.28)"/>
        <stop offset="52%" stop-color="rgba(21,200,230,.08)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
      <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#151a22"/>
        <stop offset="48%" stop-color="#0b0e14"/>
        <stop offset="72%" stop-color="#1b2835"/>
        <stop offset="100%" stop-color="#020305"/>
      </linearGradient>
      <linearGradient id="sheen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0)"/>
        <stop offset="50%" stop-color="rgba(255,255,255,.18)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f9e7b1"/>
        <stop offset="100%" stop-color="#c99632"/>
      </linearGradient>
      <linearGradient id="blackFade" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="48%" stop-color="rgba(0,0,0,.82)"/>
        <stop offset="100%" stop-color="#000"/>
      </linearGradient>
      <radialGradient id="vignette" cx="50%" cy="42%" r="72%">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,.55)"/>
      </radialGradient>
      <filter id="softBlur"><feGaussianBlur stdDeviation="20"/></filter>
      <filter id="goldGlow"><feDropShadow dx="0" dy="0" stdDeviation="18" flood-color="#f5bf55" flood-opacity=".35"/></filter>
      <filter id="cyanGlow"><feDropShadow dx="0" dy="0" stdDeviation="30" flood-color="#15c8e6" flood-opacity=".28"/></filter>
      <filter id="cardShadow"><feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#000" flood-opacity=".55"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#warmGlow)"/>
    ${content}
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  </svg>`;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)));
  });
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await ensureArchivePuzzleArt();
  await fs.rm(frameDir, { recursive: true, force: true });
  await fs.mkdir(frameDir, { recursive: true });
  for (const [key, name] of Object.entries(assetNames)) {
    assets[key] = await dataUri(name);
  }

  for (let i = 0; i < FRAMES; i++) {
    const t = i / FPS;
    const file = path.join(frameDir, `frame-${String(i).padStart(4, '0')}.jpg`);
    await sharp(Buffer.from(svg(t))).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
    if (i % FPS === 0) console.log(`rendered ${Math.round(t)}s / ${DURATION}s`);
  }

  const poster = path.join(outDir, 'puzzle-market-premium-thumbnail.jpg');
  await sharp(Buffer.from(svg(18.9))).jpeg({ quality: 92, mozjpeg: true }).toFile(poster);

  const video = path.join(outDir, `puzzle-market-premium-collectibles-20s-${W}x${H}.mp4`);
  await run(ffmpegPath, [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(frameDir, 'frame-%04d.jpg'),
    '-f', 'lavfi',
    '-i', `sine=frequency=146.83:sample_rate=48000:duration=${DURATION}`,
    '-f', 'lavfi',
    '-i', `sine=frequency=293.66:sample_rate=48000:duration=${DURATION}`,
    '-filter_complex', '[1:a]volume=0.045[a1];[2:a]volume=0.018[a2];[a1][a2]amix=inputs=2:duration=first:dropout_transition=0[a]',
    '-map', '0:v',
    '-map', '[a]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'slow',
    '-crf', W >= 2160 ? '20' : '18',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-shortest',
    video
  ]);

  console.log(JSON.stringify({ video, poster, width: W, height: H, fps: FPS, duration: DURATION }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
