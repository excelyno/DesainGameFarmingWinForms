import { CROP_MAP, type ToolId } from "./data"
import type { GameState, TileState } from "./engine"

export const TILE = 32
export const FIELD = { x: 608, y: 416, cols: 8, rows: 6 }
export const WORLD = { width: 1472, height: 1152 }
export type Facing = "up" | "down" | "left" | "right"
export type Player = {
  x: number
  y: number
  facing: Facing
  walking: boolean
}
export type Spot = "home" | "shop" | "well" | "sign" | null
export const SPOTS = [
  { id: "home" as const, x: 449, y: 521, label: "Masuk rumah" },
  { id: "shop" as const, x: 390, y: 720, label: "Bicara dengan Bu Sari" },
  { id: "well" as const, x: 918, y: 653, label: "Isi penyiram" },
  { id: "sign" as const, x: 591, y: 650, label: "Baca papan kebun" },
]
type Rect = {
  x: number
  y: number
  w: number
  h: number
}
const solids: Rect[] = [
  { x: 350, y: 372, w: 206, h: 128 },
  { x: 324, y: 652, w: 111, h: 46 },
  { x: 896, y: 605, w: 42, h: 34 },
  { x: 959, y: 458, w: 190, h: 236 },
  { x: 575, y: 618, w: 19, h: 18 },
  { x: 590, y: 390, w: 286, h: 10 },
  { x: 589, y: 612, w: 90, h: 10 },
  { x: 785, y: 612, w: 90, h: 10 },
]
type Tree = {
  x: number
  y: number
  size: number
}
export const trees: Tree[] = []
function random(n: number) {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return v - Math.floor(v)
}
for (let i = 0; i < 28; i++) {
  trees.push({
    x: 70 + i * 52,
    y: 220 + random(i) * 40,
    size: 0.9 + random(i + 1) * 0.3,
  })
  trees.push({
    x: 55 + i * 53,
    y: 1030 + random(i + 80) * 55,
    size: 0.9 + random(i + 10) * 0.3,
  })
}
for (let i = 0; i < 15; i++) {
  trees.push({ x: 106 + random(i + 100) * 54, y: 290 + i * 48, size: 1.1 })
  trees.push({ x: 1310 + random(i + 130) * 70, y: 300 + i * 49, size: 1.1 })
}
trees.push(
  { x: 278, y: 480, size: 1.2 },
  { x: 302, y: 409, size: 0.9 },
  { x: 1162, y: 408, size: 1.3 },
  { x: 1213, y: 494, size: 1 },
  { x: 1184, y: 809, size: 1.3 },
  { x: 1102, y: 856, size: 1 },
  { x: 525, y: 875, size: 1.1 },
  { x: 282, y: 836, size: 1.2 },
)

export function canWalk(x: number, y: number) {
  if (x < 188 || x > 1275 || y < 285 || y > 990) return false
  if (
    solids.some(
      (r) =>
        x + 7 > r.x && x - 7 < r.x + r.w && y + 3 > r.y && y - 4 < r.y + r.h,
    )
  )
    return false
  return !trees.some(
    (t) => Math.abs(x - t.x) < 12 * t.size && Math.abs(y - t.y) < 10 * t.size,
  )
}
export function frontTile(player: Player) {
  const direction = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[
    player.facing
  ]
  const x = Math.floor((player.x + direction[0] * 24 - FIELD.x) / TILE)
  const y = Math.floor((player.y + direction[1] * 24 - FIELD.y) / TILE)
  return x >= 0 && x < FIELD.cols && y >= 0 && y < FIELD.rows
    ? y * FIELD.cols + x
    : null
}
export function nearbySpot(player: Player) {
  return (
    SPOTS.find((s) => Math.hypot(player.x - s.x, player.y - s.y) < 50) ?? null
  )
}
export function tilePosition(id: number) {
  return {
    x: FIELD.x + (id % 8) * TILE,
    y: FIELD.y + Math.floor(id / 8) * TILE,
  }
}

type Context = CanvasRenderingContext2D
function rect(
  c: Context,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  c.fillStyle = color
  c.fillRect(Math.round(x), Math.round(y), w, h)
}
function poly(c: Context, points: number[][], color: string) {
  c.fillStyle = color
  c.beginPath()
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
  c.closePath()
  c.fill()
}
function ellipse(
  c: Context,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  c.fillStyle = color
  c.beginPath()
  c.ellipse(Math.round(x), Math.round(y), rx, ry, 0, 0, Math.PI * 2)
  c.fill()
}
function text(
  c: Context,
  value: string,
  x: number,
  y: number,
  size = 7,
  color = "#fff1c5",
) {
  c.font = `bold ${size}px monospace`
  c.textAlign = "center"
  c.fillStyle = color
  c.fillText(value, x, y)
}
function flower(c: Context, x: number, y: number, color: string) {
  rect(c, x, y, 1, 6, "#507b40")
  rect(c, x - 2, y - 2, 5, 3, color)
  rect(c, x - 1, y - 3, 3, 5, color)
  rect(c, x, y - 1, 1, 1, "#f4d78a")
}
function fence(c: Context, x: number, y: number, length: number) {
  rect(c, x, y + 2, length, 4, "#5d503b")
  rect(c, x, y - 10, length, 4, "#654b35")
  rect(c, x, y - 10, length, 2, "#cfaa70")
  for (let i = 0; i <= length; i += 28) {
    rect(c, x + i, y - 18, 6, 27, "#624c36")
    rect(c, x + i + 1, y - 19, 4, 24, "#bc945d")
    rect(c, x + i + 1, y - 19, 3, 3, "#e5c48c")
    rect(c, x + i + 2, y - 9, 1, 1, "#624c36")
  }
}
function pot(c: Context, x: number, y: number, color = "#d27861") {
  rect(c, x - 6, y - 7, 12, 9, "#7b4f3d")
  rect(c, x - 5, y - 5, 10, 8, color)
  rect(c, x - 7, y - 8, 14, 3, "#e4a175")
  flower(c, x - 2, y - 11, "#f8d16b")
  flower(c, x + 3, y - 13, "#e2a8a0")
}

function house(c: Context) {
  const x = 350,
    y = 338
  rect(c, x + 8, y + 86, 214, 91, "#52724440")
  rect(c, x - 10, y + 148, 226, 24, "#78684f")
  rect(c, x - 8, y + 146, 222, 20, "#c1b18a")
  for (let i = 0; i < 12; i++)
    rect(c, x - 7 + i * 19, y + 146, 1, 20, "#a99875")
  rect(c, x + 2, y + 66, 204, 88, "#6e5140")
  rect(c, x + 6, y + 70, 196, 80, "#e7cd97")
  for (let i = 0; i < 9; i++) {
    rect(c, x + 6, y + 75 + i * 8, 196, 1, "#c0a578")
    for (let j = 0; j < 9; j++)
      rect(c, x + 10 + j * 24 + (i % 2) * 12, y + 74 + i * 8, 1, 6, "#d7ba87")
  }
  rect(c, x + 77, y + 94, 39, 60, "#70503b")
  rect(c, x + 81, y + 97, 31, 56, "#8e6243")
  rect(c, x + 85, y + 101, 23, 22, "#5b735f")
  rect(c, x + 87, y + 103, 19, 18, "#789c8c")
  rect(c, x + 97, y + 103, 2, 18, "#c2b58d")
  rect(c, x + 85, y + 130, 23, 18, "#a0744c")
  rect(c, x + 105, y + 129, 3, 3, "#e7c16b")
  for (const wx of [25, 146]) {
    rect(c, x + wx - 4, y + 93, 34, 35, "#80583f")
    rect(c, x + wx, y + 96, 26, 27, "#94b4a5")
    rect(c, x + wx + 2, y + 98, 22, 10, "#bed2bd")
    rect(c, x + wx + 12, y + 96, 2, 27, "#dfc392")
    rect(c, x + wx, y + 108, 26, 2, "#dfc392")
    rect(c, x + wx - 5, y + 126, 36, 4, "#77563b")
    rect(c, x + wx - 5, y + 132, 36, 9, "#ad7551")
    for (let i = 0; i < 6; i++)
      flower(c, x + wx - 1 + i * 5, y + 131, i % 2 ? "#edc164" : "#cf7966")
  }
  poly(
    c,
    [
      [x - 13, y + 75],
      [x + 11, y + 6],
      [x + 194, y + 6],
      [x + 219, y + 75],
    ],
    "#634d3b",
  )
  poly(
    c,
    [
      [x - 9, y + 68],
      [x + 15, y + 8],
      [x + 190, y + 8],
      [x + 213, y + 68],
    ],
    "#a85f43",
  )
  for (let row = 0; row < 8; row++) {
    const inset = 15 - row * 3
    for (let col = 0; col < 15; col++) {
      const xx = x + inset + col * 13
      if (xx > x + 190 + row * 3 - 9) continue
      rect(c, xx, y + 11 + row * 7, 11, 5, row % 2 ? "#c67a50" : "#bc704b")
      rect(c, xx, y + 11 + row * 7, 11, 1, "#dd9a67")
      rect(c, xx + 10, y + 13 + row * 7, 1, 4, "#8b513d")
    }
  }
  rect(c, x + 9, y + 3, 188, 6, "#784f39")
  rect(c, x + 12, y + 2, 181, 3, "#d3915b")
  rect(c, x - 14, y + 69, 234, 6, "#734a35")
  rect(c, x - 13, y + 68, 234, 2, "#dfa065")
  rect(c, x + 152, y - 11, 20, 39, "#806b59")
  for (let i = 0; i < 5; i++) rect(c, x + 154, y - 9 + i * 7, 16, 5, "#b29878")
  rect(c, x + 149, y - 14, 25, 5, "#d0bd94")
  rect(c, x + 65, y + 167, 63, 6, "#9b8868")
  rect(c, x + 61, y + 173, 71, 6, "#c3b18b")
  pot(c, x + 15, y + 161)
  pot(c, x + 192, y + 161)
}

function stall(c: Context) {
  const x = 324,
    y = 631
  ellipse(c, x + 58, y + 76, 64, 12, "#58764755")
  rect(c, x + 2, y + 4, 109, 67, "#674d3c")
  rect(c, x + 6, y + 14, 101, 48, "#e7cd97")
  rect(c, x + 9, y + 21, 95, 28, "#789781")
  rect(c, x + 12, y + 24, 89, 22, "#b0c2a0")
  for (let i = 0; i < 5; i++) {
    rect(c, x + 15 + i * 17, y + 27, 13, 17, "#e6cf9a")
    rect(
      c,
      x + 19 + i * 17,
      y + 30,
      5,
      7,
      ["#6b994f", "#cb6e4a", "#e1b750", "#86954d", "#b47054"][i],
    )
    rect(c, x + 18 + i * 17, y + 39, 7, 2, "#8c7551")
  }
  rect(c, x - 3, y + 47, 117, 7, "#916841")
  rect(c, x, y + 45, 111, 5, "#efd8a3")
  rect(c, x + 8, y + 55, 95, 16, "#ab7350")
  rect(c, x + 11, y + 57, 89, 12, "#dbb87e")
  text(c, "BIBIT BU SARI", x + 55, y + 66, 7, "#6f4f34")
  rect(c, x - 5, y - 9, 121, 23, "#527d6a")
  for (let i = 0; i < 10; i++) {
    rect(c, x - 5 + i * 12, y - 9, 12, 20, i % 2 ? "#e9dfb9" : "#709d87")
    rect(c, x - 5 + i * 12, y + 10, 12, 6, i % 2 ? "#cbbf9e" : "#4e7e68")
  }
  rect(c, x - 6, y - 11, 123, 3, "#486655")
  rect(c, x + 15, y + 70, 8, 8, "#664f3e")
  rect(c, x + 90, y + 70, 8, 8, "#664f3e")
  for (let i = 0; i < 3; i++) {
    rect(c, x - 29, y + 25 + i * 13, 22, 12, "#8c6746")
    rect(c, x - 27, y + 26 + i * 13, 18, 3, "#be9a5d")
  }
}

function pond(c: Context) {
  const points = [
    [1000, 446],
    [1094, 446],
    [1094, 460],
    [1130, 460],
    [1130, 484],
    [1151, 484],
    [1151, 627],
    [1134, 627],
    [1134, 671],
    [1102, 671],
    [1102, 694],
    [1004, 694],
    [1004, 678],
    [974, 678],
    [974, 644],
    [953, 644],
    [953, 502],
    [970, 502],
    [970, 472],
    [1000, 472],
  ]
  poly(
    c,
    points.map(([x, y]) => [x + 3, y + 5]),
    "#557144",
  )
  poly(c, points, "#9b9c68")
  poly(
    c,
    points.map(([x, y]) => [1052 + (x - 1052) * 0.94, 570 + (y - 570) * 0.95]),
    "#497f83",
  )
  poly(
    c,
    points.map(([x, y]) => [1052 + (x - 1052) * 0.87, 570 + (y - 570) * 0.9]),
    "#78b4b0",
  )
  poly(
    c,
    points.map(([x, y]) => [1052 + (x - 1052) * 0.71, 570 + (y - 570) * 0.79]),
    "#87c5ba",
  )
  for (let i = 0; i < 54; i++) {
    const x = 982 + random(i + 5) * 141,
      y = 485 + random(i + 60) * 172
    rect(c, x, y, 3 + random(i) * 10, 1, i % 3 ? "#b5dbbd" : "#609c9c")
  }
  for (const [x, y] of [
    [997, 520],
    [1104, 608],
    [1004, 640],
    [1080, 485],
  ]) {
    ellipse(c, x, y, 8, 4, "#4f9060")
    rect(c, x, y - 4, 1, 5, "#bdd091")
    flower(c, x + 2, y - 3, "#e8c6b7")
  }
  for (let i = 0; i < 8; i++) {
    const x = 965 + i * 5,
      y = 663 + (i % 3) * 4
    rect(c, x, y - 17, 2, 20, "#5c8446")
    rect(c, x + 1, y - 21, 3, 7, "#96724b")
  }
  rect(c, 929, 566, 72, 28, "#705b43")
  for (let i = 0; i < 9; i++) {
    rect(c, 930 + i * 8, 565, 7, 27, "#b79a69")
    rect(c, 931 + i * 8, 567, 1, 23, "#d0b782")
  }
  rect(c, 931, 564, 4, 32, "#796146")
  rect(c, 989, 564, 4, 32, "#796146")
}

export function createTerrain() {
  const canvas = document.createElement("canvas")
  canvas.width = WORLD.width
  canvas.height = WORLD.height
  const c = canvas.getContext("2d")!
  c.imageSmoothingEnabled = false
  rect(c, 0, 0, WORLD.width, WORLD.height, "#90ae69")
  for (let i = 0; i < 27000; i++) {
    const x = random(i + 2) * WORLD.width,
      y = random(i + 40000) * WORLD.height
    rect(
      c,
      x,
      y,
      2 + random(i + 8) * 4,
      1 + Math.floor(random(i) * 2),
      ["#829f5b", "#a2ba76", "#96b46d", "#7e9e58"][i % 4],
    )
    if (i % 12 === 0) {
      rect(c, x + 2, y - 2, 1, 3, "#718f52")
      rect(c, x + 4, y - 1, 1, 2, "#b2c380")
    }
  }
  // Worn footpaths connect the house, garden, pond and village.
  const paths = [
    { x: 422, y: 497, w: 54, h: 211 },
    { x: 432, y: 625, w: 501, h: 47 },
    { x: 705, y: 609, w: 54, h: 388 },
    { x: 280, y: 700, w: 483, h: 43 },
    { x: 726, y: 810, w: 432, h: 43 },
  ]
  for (const p of paths) {
    rect(c, p.x - 3, p.y - 3, p.w + 6, p.h + 6, "#a4a56c")
    rect(c, p.x, p.y, p.w, p.h, "#c4b180")
    for (let i = 0; i < (p.w * p.h) / 90; i++) {
      const x = p.x + random(i + p.x) * p.w,
        y = p.y + random(i + p.y) * p.h
      rect(c, x, y, random(i + 100) * 5 + 1, 1, i % 3 ? "#b8a477" : "#d6c090")
    }
  }
  rect(c, FIELD.x - 9, FIELD.y - 9, 274, 210, "#87985b")
  rect(c, FIELD.x - 5, FIELD.y - 5, 266, 202, "#b49b68")
  for (let i = 0; i < 900; i++)
    rect(
      c,
      FIELD.x - 5 + random(i) * 266,
      FIELD.y - 5 + random(i + 99) * 202,
      2,
      1,
      "#c5ad79",
    )
  fence(c, 590, 398, 280)
  fence(c, 589, 619, 84)
  fence(c, 785, 619, 84)
  // Smaller nursery beds behind the house.
  for (let row = 0; row < 3; row++) {
    rect(c, 633, 310 + row * 19, 160, 12, "#816743")
    for (let col = 0; col < 15; col++) {
      rect(c, 638 + col * 10, 313 + row * 19, 5, 5, "#517f42")
      rect(c, 640 + col * 10, 310 + row * 19, 2, 5, "#c1c76d")
    }
  }
  pond(c)
  house(c)
  stall(c)
  // Garden well, with timber winch and a blue water interior.
  ellipse(c, 918, 637, 25, 10, "#58754466")
  rect(c, 898, 614, 39, 23, "#77796b")
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 4; col++)
      rect(
        c,
        899 + col * 10 + (row % 2) * -4,
        615 + row * 7,
        9,
        6,
        row % 2 ? "#b6b49a" : "#c6c1a0",
      )
  ellipse(c, 918, 613, 20, 8, "#ded2aa")
  ellipse(c, 918, 613, 14, 5, "#48787a")
  rect(c, 899, 580, 4, 40, "#846640")
  rect(c, 932, 580, 4, 40, "#846640")
  rect(c, 899, 579, 37, 5, "#b09362")
  rect(c, 916, 584, 1, 26, "#d6c99a")
  rect(c, 911, 606, 12, 7, "#a58c66")
  rect(c, 910, 605, 14, 2, "#d6c99a")
  // Signpost and a small wooden produce shipping box.
  rect(c, 583, 626, 4, 22, "#6f593b")
  rect(c, 571, 613, 31, 20, "#674d35")
  rect(c, 573, 615, 27, 15, "#c6a16b")
  text(c, "KEBUN", 587, 625, 6, "#765535")
  rect(c, 522, 526, 34, 26, "#775438")
  rect(c, 524, 528, 30, 22, "#b68c53")
  rect(c, 525, 530, 28, 3, "#d7b073")
  rect(c, 536, 528, 3, 22, "#775438")
  text(c, "PANEN", 540, 545, 5, "#f8dfaa")
  for (let i = 0; i < 180; i++) {
    const x = 205 + random(i + 400) * 1040,
      y = 305 + random(i + 800) * 650
    if ((x > 320 && x < 1165 && y > 320 && y < 765) || (x > 690 && x < 775))
      continue
    flower(c, x, y, ["#f0d47d", "#eadcba", "#cf987a", "#c5b7cb"][i % 4])
  }
  for (const [x, y] of [
    [822, 770],
    [874, 824],
    [1132, 759],
    [558, 729],
    [301, 576],
    [863, 344],
  ]) {
    ellipse(c, x, y + 3, 12, 5, "#647e4c55")
    poly(
      c,
      [
        [x - 11, y],
        [x - 6, y - 9],
        [x + 5, y - 11],
        [x + 12, y - 3],
        [x + 9, y + 4],
        [x - 6, y + 4],
      ],
      "#7f8976",
    )
    poly(
      c,
      [
        [x - 9, y - 1],
        [x - 5, y - 8],
        [x + 4, y - 9],
        [x + 7, y - 3],
      ],
      "#acb09a",
    )
  }
  fence(c, 210, 969, 448)
  fence(c, 792, 969, 448)
  return canvas
}

export function drawTree(c: Context, x: number, y: number, size: number) {
  c.save()
  c.translate(Math.round(x), Math.round(y))
  c.scale(size, size)
  ellipse(c, 7, 2, 31, 11, "#426c4940")
  rect(c, -6, -35, 12, 38, "#66553c")
  rect(c, -3, -33, 5, 32, "#a17d4d")
  rect(c, 3, -29, 2, 29, "#7a6041")
  poly(
    c,
    [
      [-9, 3],
      [-3, -6],
      [4, -6],
      [10, 3],
    ],
    "#755c3d",
  )
  // Overlapping, stepped leaf clusters make an organic pixel silhouette.
  const clusters = [
    [-20, -42, 19],
    [0, -40, 20],
    [23, -46, 19],
    [-30, -60, 20],
    [-7, -63, 25],
    [19, -68, 23],
    [-20, -82, 23],
    [3, -86, 23],
    [0, -99, 16],
  ]
  for (let i = 0; i < clusters.length; i++) {
    const [cx, cy, r] = clusters[i]
    const outline = (radius: number, color: string, ox = 0, oy = 0) => {
      for (let yy = -radius; yy <= radius; yy += 3) {
        const ww =
          Math.floor(Math.sqrt(Math.max(0, radius * radius - yy * yy)) / 3) * 3
        rect(c, cx - ww + ox, cy + yy + oy, ww * 2, 3, color)
      }
    }
    outline(r, "#3f6540")
    outline(r - 2, "#4e7940", -1, -1)
    outline(r - 5, "#638e47", -3, -4)
    for (let j = 0; j < 34; j++) {
      const a = random(j + i * 37) * Math.PI * 2,
        rr = random(j + 90 + i * 43) * (r - 4)
      const dx = cx + Math.cos(a) * rr,
        dy = cy + Math.sin(a) * rr
      const color =
        dy < cy - 3
          ? ["#88a751", "#9ab65e", "#729b48", "#648d41"][j % 4]
          : ["#426f40", "#5c8743", "#6e9346", "#547d3d"][j % 4]
      rect(c, dx, dy, 2 + Math.floor(random(j + 9) * 3), 2, color)
      if (j % 3 === 0) rect(c, dx + 1, dy - 1, 2, 1, "#a2b764")
    }
  }
  c.restore()
}

function drawCrop(
  c: Context,
  tile: TileState,
  x: number,
  y: number,
  time: number,
) {
  const plant = tile.plant
  if (!plant) return
  const crop = CROP_MAP[plant.cropId]
  const progress = plant.age / crop.days
  const h = Math.round(7 + progress * 17)
  const sway = Math.sin(time / 700 + tile.id) * 0.8
  c.save()
  c.translate(Math.round(x + 16 + sway), y + 23)
  const leaf = plant.dryDays >= 3 ? "#9a8b53" : crop.leaf
  rect(c, -1, -h, 2, h, "#537142")
  for (let i = 0; i < 3 + Math.floor(progress * 3); i++) {
    const dir = i % 2 ? 1 : -1,
      yy = -4 - i * 3
    rect(c, dir > 0 ? 1 : -8, yy, 7, 3, leaf)
    rect(c, dir > 0 ? 4 : -6, yy - 2, 4, 2, leaf)
    rect(c, dir > 0 ? 2 : -7, yy, 3, 1, "#a2ba60")
  }
  if (progress >= 0.65) {
    const color = crop.produce
    if (crop.shape === "head") {
      rect(c, -7, -h - 2, 14, 9, color)
      rect(c, -5, -h - 4, 10, 2, "#f3e8c6")
    } else if (crop.shape === "tall") {
      rect(c, 2, -h + 4, 4, 10, color)
      rect(c, -4, -h + 8, 4, 8, color)
    } else if (crop.shape === "bush") {
      for (let i = 0; i < 3; i++) {
        rect(c, -9 + i * 6, -h + 3 + (i % 2) * 5, 5, 5, color)
        rect(c, -8 + i * 6, -h + 3 + (i % 2) * 5, 2, 1, "#f2c895")
      }
    } else {
      rect(c, -5, -h + 2, 10, 5, color)
    }
  }
  if (progress >= 1) {
    const a = Math.sin(time / 400 + tile.id)
    if (a > 0.3) {
      rect(c, 9, -h - 5, 1, 5, "#fff1a5")
      rect(c, 7, -h - 3, 5, 1, "#fff1a5")
    }
  }
  c.restore()
}

export function drawField(c: Context, game: GameState, time: number) {
  for (const tile of game.tiles) {
    const { x, y } = tilePosition(tile.id)
    const soil = tile.kind === "soil"
    rect(
      c,
      x,
      y,
      32,
      32,
      soil ? (tile.plant?.watered ? "#76583e" : "#a8784e") : "#a58c5a",
    )
    rect(
      c,
      x + 1,
      y + 1,
      30,
      29,
      soil ? (tile.plant?.watered ? "#806044" : "#b88655") : "#b29b68",
    )
    for (let j = 0; j < 14; j++) {
      rect(
        c,
        x + 2 + random(j + tile.id * 8) * 27,
        y + 2 + random(j + tile.id * 11 + 40) * 27,
        2,
        1,
        soil ? "#91653f" : "#c2ad78",
      )
    }
    if (soil) {
      for (let j = 0; j < 4; j++) {
        rect(
          c,
          x + 4,
          y + 5 + j * 6,
          24,
          1,
          tile.plant?.watered ? "#654d39" : "#9c6d45",
        )
        rect(
          c,
          x + 5,
          y + 6 + j * 6,
          22,
          1,
          tile.plant?.watered ? "#8c6b48" : "#cd9b63",
        )
      }
      if (tile.tilled === 2) rect(c, x + 2, y + 2, 2, 28, "#d0a070")
    }
    if (tile.kind === "weed") {
      for (let j = 0; j < 6; j++) {
        const xx = x + 7 + j * 3,
          yy = y + 23
        rect(c, xx, yy - 8 - (j % 3) * 3, 2, 10, "#687d3e")
        rect(c, xx - 2, yy - 5 - (j % 2) * 5, 5, 2, "#869c4a")
      }
    }
    if (tile.kind === "rock") {
      poly(
        c,
        [
          [x + 6, y + 24],
          [x + 5, y + 15],
          [x + 11, y + 10],
          [x + 22, y + 11],
          [x + 27, y + 19],
          [x + 23, y + 25],
        ],
        "#727a68",
      )
      poly(
        c,
        [
          [x + 7, y + 18],
          [x + 12, y + 11],
          [x + 21, y + 12],
          [x + 23, y + 18],
        ],
        "#a8aa8d",
      )
      rect(c, x + 10, y + 13, 6, 2, "#c2c2a2")
    }
    drawCrop(c, tile, x, y, time)
  }
}

export function drawPlayer(
  c: Context,
  player: Player,
  time: number,
  action: number,
  tool: ToolId,
  npc = false,
) {
  const x = Math.round(player.x),
    y = Math.round(player.y)
  const stride = player.walking ? Math.sin(time / 70) : 0
  const bob = player.walking ? Math.round(Math.abs(stride) * 1.5) : 0
  c.save()
  c.translate(x, y)
  ellipse(c, 0, 1, 11, 4, "#3d574d45")
  rect(c, -7, -8 + stride * 2, 5, 8, "#51473a")
  rect(c, 3, -8 - stride * 2, 5, 8, "#51473a")
  rect(c, -7, -10, 5, 5, "#7d6847")
  rect(c, 3, -10, 5, 5, "#7d6847")
  c.translate(0, -bob)
  rect(c, -9, -23, 18, 16, "#465647")
  rect(c, -8, -24, 16, 15, npc ? "#c88661" : "#83a995")
  rect(c, -6, -11, 12, 5, npc ? "#8b604b" : "#bd9c58")
  rect(c, -3, -24, 6, 12, npc ? "#dfaa76" : "#e5d6a8")
  rect(c, -10, -21 + stride * 2, 4, 10, "#5b6a4d")
  rect(c, 7, -21 - stride * 2, 4, 10, "#5b6a4d")
  rect(c, -10, -16 + stride * 2, 4, 6, "#d3a578")
  rect(c, 7, -16 - stride * 2, 4, 6, "#d3a578")
  rect(c, -8, -37, 16, 15, "#554336")
  rect(c, -7, -35, 14, 12, "#d8ad7e")
  rect(c, -6, -33, 12, 9, "#e7bf90")
  if (player.facing === "up") {
    rect(c, -7, -35, 14, 13, "#584837")
    rect(c, -6, -34, 4, 10, "#69533c")
    rect(c, -6, -23, 12, 5, npc ? "#ad7656" : "#729780")
  } else {
    const shift =
      player.facing === "left" ? -3 : player.facing === "right" ? 3 : 0
    rect(c, -4 + shift, -30, 2, 2, "#3e3b34")
    rect(c, 3 + shift, -30, 2, 2, "#3e3b34")
    rect(c, -1 + shift, -25, 3, 1, "#a47359")
    rect(c, -7, -34, 3, 9, "#594834")
    rect(c, 6, -34, 2, 7, "#594834")
  }
  // Wide woven cap, with a blue indigo band rather than a generic round head.
  rect(c, -13, -37, 26, 4, "#6c5739")
  rect(c, -12, -39, 24, 4, npc ? "#c8a17b" : "#bc9961")
  rect(c, -8, -46, 16, 9, npc ? "#ddbea1" : "#cfb27a")
  rect(c, -6, -48, 12, 3, npc ? "#ddbea1" : "#e1c58c")
  rect(c, -8, -40, 16, 3, npc ? "#996a50" : "#557b7b")
  rect(c, -10, -38, 20, 1, "#edd3a0")
  if (action > 0) {
    c.save()
    c.translate(player.facing === "left" ? -13 : 13, -18)
    c.rotate((1 - action) * -1.8)
    drawTool(c, tool, -10, -14, 1)
    c.restore()
  }
  c.restore()
}

export function drawTool(
  c: Context,
  tool: ToolId | "coin" | "bag" | "book",
  x = 0,
  y = 0,
  scale = 1,
) {
  c.save()
  c.translate(x, y)
  c.scale(scale, scale)
  if (tool === "sabit") {
    poly(
      c,
      [
        [5, 24],
        [8, 25],
        [17, 10],
        [14, 8],
      ],
      "#725139",
    )
    poly(
      c,
      [
        [6, 24],
        [7, 24],
        [16, 10],
        [15, 9],
      ],
      "#c6a06c",
    )
    poly(
      c,
      [
        [11, 8],
        [12, 3],
        [18, 1],
        [23, 3],
        [26, 8],
        [26, 14],
        [22, 19],
        [18, 20],
        [22, 14],
        [23, 9],
        [21, 5],
        [16, 5],
        [13, 8],
      ],
      "#526e69",
    )
    poly(
      c,
      [
        [12, 7],
        [14, 3],
        [19, 2],
        [23, 4],
        [25, 9],
        [24, 14],
        [20, 18],
        [23, 12],
        [22, 7],
        [20, 4],
        [15, 4],
      ],
      "#b5c8b0",
    )
    rect(c, 17, 2, 4, 1, "#e6e7c5")
  } else if (tool === "cangkul" || tool === "beliung") {
    c.save()
    c.translate(12, 12)
    c.rotate(0.6)
    rect(c, -2, -8, 4, 23, "#6d4b35")
    rect(c, -1, -8, 2, 22, "#c99f64")
    if (tool === "cangkul") {
      rect(c, -10, -10, 15, 3, "#4c6665")
      rect(c, -10, -10, 7, 9, "#96af9f")
      rect(c, -9, -10, 5, 2, "#d4dbba")
    } else if (tool === "beliung") {
      poly(
        c,
        [
          [-12, -6],
          [-7, -12],
          [5, -13],
          [12, -6],
          [6, -8],
          [-6, -8],
        ],
        "#9fb6ad",
      )
      rect(c, -5, -12, 9, 2, "#dce0c2")
    }
    c.restore()
  } else if (tool === "penyiram") {
    rect(c, 4, 10, 16, 13, "#456d7b")
    rect(c, 5, 10, 14, 10, "#7ba8ae")
    rect(c, 8, 5, 9, 6, "#456d7b")
    rect(c, 10, 7, 5, 4, "#e9d9b0")
    poly(
      c,
      [
        [4, 12],
        [0, 9],
        [-2, 12],
        [4, 19],
      ],
      "#7ba8ae",
    )
    rect(c, -3, 9, 4, 4, "#b9d0c1")
    rect(c, 8, 12, 4, 7, "#acc6bd")
    rect(c, 20, 12, 3, 7, "#456d7b")
  } else if (tool === "bibit") {
    rect(c, 4, 5, 17, 21, "#886641")
    rect(c, 5, 6, 15, 18, "#e0c58d")
    rect(c, 5, 6, 15, 3, "#b99b66")
    rect(c, 11, 12, 2, 9, "#56854b")
    rect(c, 6, 11, 6, 4, "#6c9954")
    rect(c, 13, 9, 6, 4, "#82a55c")
    rect(c, 7, 23, 11, 1, "#b99b66")
  } else if (tool === "tangan") {
    rect(c, 7, 12, 13, 12, "#b27d58")
    rect(c, 7, 10, 12, 12, "#edc695")
    for (let i = 0; i < 4; i++)
      rect(c, 7 + i * 3, 4 + (i % 2) * 2, 2, 12, "#edc695")
    rect(c, 3, 14, 6, 6, "#edc695")
  } else if (tool === "coin") {
    rect(c, 7, 3, 12, 2, "#b78838")
    rect(c, 4, 5, 18, 16, "#ba8834")
    rect(c, 7, 21, 12, 2, "#9c7130")
    rect(c, 6, 5, 14, 15, "#efd17c")
    rect(c, 9, 7, 8, 11, "#d5a653")
    rect(c, 11, 8, 3, 9, "#fff0b1")
  } else if (tool === "bag") {
    rect(c, 6, 2, 13, 7, "#674d36")
    rect(c, 8, 3, 9, 5, "#d1b57d")
    rect(c, 3, 8, 20, 17, "#876644")
    rect(c, 4, 8, 18, 14, "#c29b64")
    rect(c, 6, 16, 14, 7, "#a57b4d")
    rect(c, 11, 15, 4, 4, "#e6ce8a")
  } else {
    rect(c, 2, 4, 22, 21, "#5e6347")
    rect(c, 3, 3, 10, 19, "#e4d3a5")
    rect(c, 14, 3, 9, 19, "#f4e5ba")
    rect(c, 12, 4, 2, 19, "#a28a5c")
    for (let i = 0; i < 4; i++) {
      rect(c, 5, 7 + i * 3, 5, 1, "#a9a078")
      rect(c, 16, 7 + i * 3, 5, 1, "#b4a779")
    }
  }
  c.restore()
}

export function drawScene(
  c: Context,
  terrain: HTMLCanvasElement,
  game: GameState,
  player: Player,
  time: number,
  action: number,
) {
  c.drawImage(terrain, 0, 0)
  drawField(c, game, time)
  const target = frontTile(player)
  if (target !== null) {
    const p = tilePosition(target)
    c.strokeStyle = "#fff3bf"
    c.lineWidth = 1
    c.setLineDash([])
    for (const [dx, dy, sx, sy] of [
      [1, 1, 1, 1],
      [31, 1, -1, 1],
      [1, 31, 1, -1],
      [31, 31, -1, -1],
    ]) {
      rect(c, p.x + dx, p.y + dy, 7 * sx, 1, "#fff2b2")
      rect(c, p.x + dx, p.y + dy, 1, 7 * sy, "#fff2b2")
    }
  }
  const drawables = trees.map((t) => ({
    y: t.y,
    draw: () => drawTree(c, t.x, t.y, t.size),
  }))
  drawables.push({
    y: player.y,
    draw: () => drawPlayer(c, player, time, action, game.selectedTool),
  })
  drawables.push({
    y: 724,
    draw: () =>
      drawPlayer(
        c,
        { x: 363, y: 724, facing: "down", walking: false },
        time,
        0,
        "tangan",
        true,
      ),
  })
  drawables.sort((a, b) => a.y - b.y).forEach((o) => o.draw())
  // Small living details: hens, pond ripples, drifting petals.
  for (let i = 0; i < 3; i++) {
    const x = 512 + i * 27 + Math.round(Math.sin(time / 3000 + i) * 6),
      y = 577 + i * 9
    ellipse(c, x, y + 2, 5, 2, "#5c784342")
    rect(c, x - 4, y - 6, 9, 6, "#ece2bb")
    rect(c, x + 2, y - 9, 5, 6, "#f6eccc")
    rect(c, x + 4, y - 11, 3, 3, "#be6951")
    rect(c, x + 7, y - 6, 3, 2, "#d3a355")
    rect(c, x + 5, y - 8, 1, 1, "#5c5345")
    rect(c, x - 2, y, 1, 3, "#bc9257")
  }
  c.globalAlpha = 0.55
  for (let i = 0; i < 14; i++) {
    const x = 280 + ((time / 40 + i * 83) % 920),
      y = 345 + ((i * 47) % 520) + Math.sin(time / 1800 + i) * 20
    rect(c, x, y, 2, 1, "#f0e6ad")
  }
  c.globalAlpha = 1
  if (action > 0 && target !== null) {
    const p = tilePosition(target)
    for (let i = 0; i < 6; i++) {
      const xx = p.x + 16 + Math.cos(i * 1.3) * (1 - action) * 23,
        yy = p.y + 10 + Math.sin(i * 1.3) * (1 - action) * 14 - action * 7
      rect(
        c,
        xx,
        yy,
        2,
        2,
        game.selectedTool === "penyiram" ? "#c2e1df" : "#f3d59d",
      )
    }
  }
  if (game.weather === "hujan") {
    c.globalAlpha = 0.35
    for (let i = 0; i < 160; i++) {
      const x = (i * 47 + time / 11) % WORLD.width,
        y = (i * 79 + time / 4) % WORLD.height
      rect(c, x, y, 1, 7, "#d7e9d6")
    }
    c.globalAlpha = 1
  }
}
