// Generates static PNG icons for the PWA manifest
// Run once: node scripts/generate-icons.mjs

import { deflateSync } from 'zlib'
import { writeFileSync } from 'fs'

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}

function makePNG(size, bg, fg) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB

  // Draw train icon with CSS-box approach
  const [br, bg2, bb] = bg
  const [fr, fg2, fb] = fg

  function getPixel(x, y) {
    const cx = size / 2
    const s = size / 100  // scale factor

    // Background is purple (bg color) - check rounded corners
    const radius = 22 * s
    const inRoundedRect =
      x >= radius && x <= size - radius ||
      y >= radius && y <= size - radius ||
      (Math.hypot(x - radius, y - radius) <= radius) ||
      (Math.hypot(x - (size - radius), y - radius) <= radius) ||
      (Math.hypot(x - radius, y - (size - radius)) <= radius) ||
      (Math.hypot(x - (size - radius), y - (size - radius)) <= radius)

    if (!inRoundedRect) return null  // transparent → white fallback

    // Train body: rect from 22% to 78% x, 45% to 72% y
    const bodyX1 = 22 * s, bodyX2 = 78 * s
    const bodyY1 = 45 * s, bodyY2 = 72 * s
    if (x >= bodyX1 && x <= bodyX2 && y >= bodyY1 && y <= bodyY2) return [fr, fg2, fb]

    // Cab: rect from 72% to 92% x, 32% to 72% y
    const cabX1 = 72 * s, cabX2 = 92 * s
    const cabY1 = 32 * s, cabY2 = 72 * s
    if (x >= cabX1 && x <= cabX2 && y >= cabY1 && y <= cabY2) return [Math.round(fr * 0.75), Math.round(fg2 * 0.75), Math.round(fb * 0.75)]

    // Window: rect inside cab
    const winX1 = 74 * s, winX2 = 88 * s
    const winY1 = 36 * s, winY2 = 52 * s
    if (x >= winX1 && x <= winX2 && y >= winY1 && y <= winY2) return [196, 191, 255]

    // Smokestack: rect 30%-38% x, 28%-45% y
    const stX1 = 30 * s, stX2 = 38 * s
    const stY1 = 28 * s, stY2 = 45 * s
    if (x >= stX1 && x <= stX2 && y >= stY1 && y <= stY2) return [fr, fg2, fb]

    // Rail: rect across bottom 0-100% x, 75%-80% y
    const railY1 = 75 * s, railY2 = 80 * s
    if (y >= railY1 && y <= railY2) return [fr, fg2, fb]

    // Left wheel: circle at 36%, 72%, r=8%
    const lw = Math.hypot(x - 36 * s, y - 72 * s)
    if (lw <= 8 * s) return [Math.round(fr * 0.75), Math.round(fg2 * 0.75), Math.round(fb * 0.75)]

    // Right wheel: circle at 64%, 72%, r=8%
    const rw = Math.hypot(x - 64 * s, y - 72 * s)
    if (rw <= 8 * s) return [Math.round(fr * 0.75), Math.round(fg2 * 0.75), Math.round(fb * 0.75)]

    return [br, bg2, bb]
  }

  const rowBytes = 1 + size * 3
  const raw = Buffer.alloc(rowBytes * size, 255)
  for (let y = 0; y < size; y++) {
    raw[y * rowBytes] = 0
    for (let x = 0; x < size; x++) {
      const px = getPixel(x, y) ?? [237, 233, 255]
      const off = y * rowBytes + 1 + x * 3
      raw[off] = px[0]; raw[off + 1] = px[1]; raw[off + 2] = px[2]
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// bg: light purple, fg: purple
const bg = [237, 233, 255]
const fg = [127, 119, 221]

writeFileSync('public/icon-512.png', makePNG(512, bg, fg))
writeFileSync('public/icon-192.png', makePNG(192, bg, fg))
console.log('✓ Generated public/icon-512.png and public/icon-192.png')
