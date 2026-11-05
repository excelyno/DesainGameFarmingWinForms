export type SeasonId = "hujan" | "pancaroba" | "kemarau"
export type Shape = "bush" | "head" | "leafy" | "root" | "tall"

export const DAYS_PER_SEASON = 7

export const SEASON_CYCLE: {
  id: SeasonId
  name: string
  rain: number
  tint: string
}[] = [
  { id: "hujan", name: "Musim Hujan", rain: 0.65, tint: "#5b8fb9" },
  { id: "pancaroba", name: "Pancaroba I", rain: 0.35, tint: "#8aa65a" },
  { id: "kemarau", name: "Musim Kemarau", rain: 0.1, tint: "#d99a3b" },
  { id: "pancaroba", name: "Pancaroba II", rain: 0.35, tint: "#8aa65a" },
]

export const SEASON_LABEL: Record<SeasonId, string> = {
  hujan: "Hujan",
  pancaroba: "Pancaroba",
  kemarau: "Kemarau",
}

export type Care = { kind: "none" } | {
  kind: "once"
  label: string
  desc: string
} | {
  kind: "interval"
  every: number
  label: string
  desc: string
  usesPupuk?: boolean
}

export type CropDef = {
  id: string
  name: string
  latin: string
  seasons: SeasonId[]
  seedPrice: number
  sellPrice: number
  days: number
  waterEvery: 1 | 2
  shape: Shape
  produce: string
  leaf: string
  care: Care
  requiresGuludan?: boolean
  overwaterSensitive?: boolean
  regrow?: number
  info: {
    asal: string
    manfaat: string
    ekosistem: string
    fakta: string
  }
}

export const CROPS: CropDef[] = [
  {
    id: "cabai",
    name: "Cabai Rawit",
    latin: "Capsicum frutescens",
    seasons: ["kemarau", "pancaroba"],
    seedPrice: 20,
    sellPrice: 45,
    days: 6,
    waterEvery: 1,
    shape: "bush",
    produce: "#e0352b",
    leaf: "#3f8f3a",
    care: {
      kind: "once",
      label: "Pasang Ajir",
      desc: "Batang cabai rapuh saat berbuah. Tancapkan ajir bambu agar tidak rebah.",
    },
    info: {
      asal: "Ditanam luas di dataran rendah hingga menengah, sentra di Jawa Timur dan Jawa Tengah.",
      manfaat: "Bumbu dapur utama, kaya vitamin C dan capsaicin.",
      ekosistem:
        "Bunganya menarik lebah kecil. Kehadiran kepik membantu mengendalikan kutu daun.",
      fakta:
        "Rasa pedas cabai adalah mekanisme pertahanan agar tidak dimakan mamalia.",
    },
  },
  {
    id: "kembangkol",
    name: "Kembang Kol",
    latin: "Brassica oleracea var. botrytis",
    seasons: ["hujan", "pancaroba"],
    seedPrice: 30,
    sellPrice: 75,
    days: 7,
    waterEvery: 1,
    shape: "head",
    produce: "#f3ecd2",
    leaf: "#4f9a4a",
    care: {
      kind: "interval",
      every: 3,
      label: "Beri Pupuk Kompos",
      desc: "Rakus hara. Beri pupuk kompos setiap 3 hari agar kepala bunga padat.",
      usesPupuk: true,
    },
    info: {
      asal: "Cocok di dataran tinggi sejuk seperti Dieng, Batu, dan Lembang.",
      manfaat: "Sumber serat, folat, dan vitamin K.",
      ekosistem:
        "Kompos dari sisa daunnya mengembalikan hara ke tanah dan memberi makan cacing.",
      fakta:
        "Bagian yang dimakan sebenarnya adalah kuncup bunga yang belum mekar.",
    },
  },
  {
    id: "ubijalar",
    name: "Ubi Jalar",
    latin: "Ipomoea batatas",
    seasons: ["kemarau", "pancaroba"],
    seedPrice: 15,
    sellPrice: 40,
    days: 6,
    waterEvery: 2,
    shape: "root",
    produce: "#9b4f96",
    leaf: "#5aa04a",
    care: { kind: "none" },
    requiresGuludan: true,
    overwaterSensitive: true,
    info: {
      asal: "Pangan pokok di Papua (Lembah Baliem) dan banyak ditanam di Jawa Barat.",
      manfaat:
        "Karbohidrat kompleks, beta-karoten, dan antosianin pada ubi ungu.",
      ekosistem: "Tanaman rambatnya menutup tanah sehingga mengurangi erosi.",
      fakta:
        "Wajib ditanam di guludan (tanah ditinggikan) agar umbi tidak busuk karena air.",
    },
  },
  {
    id: "tomat",
    name: "Tomat",
    latin: "Solanum lycopersicum",
    seasons: ["pancaroba", "kemarau"],
    seedPrice: 25,
    sellPrice: 55,
    days: 6,
    waterEvery: 1,
    shape: "bush",
    produce: "#e8553d",
    leaf: "#3c8a3f",
    care: {
      kind: "once",
      label: "Pasang Ajir",
      desc: "Tomat merambat dan berbuah lebat. Ikat ke ajir agar buah tidak menyentuh tanah.",
    },
    info: {
      asal: "Banyak dibudidayakan di dataran menengah seperti Garut dan Malang.",
      manfaat: "Kaya likopen dan vitamin A.",
      ekosistem:
        "Daunnya mengeluarkan aroma yang mengusir beberapa jenis hama.",
      fakta: "Secara botani tomat adalah buah, bukan sayur.",
    },
  },
  {
    id: "jagung",
    name: "Jagung",
    latin: "Zea mays",
    seasons: ["kemarau", "pancaroba"],
    seedPrice: 20,
    sellPrice: 50,
    days: 7,
    waterEvery: 1,
    shape: "tall",
    produce: "#f2c94c",
    leaf: "#5d9c3a",
    care: {
      kind: "once",
      label: "Siangi Gulma",
      desc: "Gulma merebut hara jagung muda. Cabut gulma di sekitar batang sekali.",
    },
    info: {
      asal: "Pangan pokok di Madura, NTT, dan Gorontalo.",
      manfaat: "Sumber karbohidrat dan pakan ternak.",
      ekosistem: "Batang sisa panen bisa menjadi pakan sapi dan mulsa tanah.",
      fakta: "Setiap helai rambut jagung terhubung ke satu biji.",
    },
  },
  {
    id: "bayam",
    name: "Bayam",
    latin: "Amaranthus spp.",
    seasons: ["hujan", "pancaroba"],
    seedPrice: 10,
    sellPrice: 22,
    days: 3,
    waterEvery: 1,
    shape: "leafy",
    produce: "#2f7a34",
    leaf: "#47a344",
    care: { kind: "none" },
    info: {
      asal: "Tumbuh di hampir seluruh Indonesia, sering di pekarangan rumah.",
      manfaat: "Sumber zat besi dan kalsium.",
      ekosistem: "Bijinya menjadi makanan burung pipit dan gelatik.",
      fakta: "Bisa dipanen dalam 3 minggu, termasuk sayur tercepat.",
    },
  },
  {
    id: "padi",
    name: "Padi",
    latin: "Oryza sativa",
    seasons: ["hujan"],
    seedPrice: 25,
    sellPrice: 70,
    days: 8,
    waterEvery: 1,
    shape: "tall",
    produce: "#e3c26b",
    leaf: "#7cb342",
    care: {
      kind: "once",
      label: "Atur Genangan",
      desc: "Padi sawah butuh genangan dangkal saat fase anakan. Atur pematang sekali.",
    },
    info: {
      asal: "Lumbung padi utama: Jawa Barat, Jawa Timur, dan Sulawesi Selatan.",
      manfaat: "Makanan pokok sebagian besar penduduk Indonesia.",
      ekosistem:
        "Sawah menjadi habitat katak, capung, dan burung kuntul pemakan hama.",
      fakta: "Sistem subak di Bali mengatur air sawah dan diakui UNESCO.",
    },
  },
  {
    id: "kangkung",
    name: "Kangkung",
    latin: "Ipomoea aquatica",
    seasons: ["hujan"],
    seedPrice: 10,
    sellPrice: 20,
    days: 3,
    waterEvery: 1,
    shape: "leafy",
    produce: "#357a2c",
    leaf: "#5fb04b",
    care: { kind: "none" },
    regrow: 2,
    info: {
      asal: "Tumbuh subur di lahan basah, terkenal kangkung Bali dan Lombok.",
      manfaat: "Sumber vitamin A dan zat besi.",
      ekosistem:
        "Akarnya menyerap kelebihan nutrien di air sehingga membantu menjernihkan.",
      fakta:
        "Setelah dipotong, kangkung tumbuh kembali dan bisa dipanen berkali-kali.",
    },
  },
  {
    id: "kacang",
    name: "Kacang Tanah",
    latin: "Arachis hypogaea",
    seasons: ["kemarau"],
    seedPrice: 20,
    sellPrice: 48,
    days: 6,
    waterEvery: 2,
    shape: "root",
    produce: "#c9a56a",
    leaf: "#4f9a3c",
    care: {
      kind: "once",
      label: "Bumbun Tanah",
      desc: "Timbun pangkal batang dengan tanah agar ginofor bisa masuk dan membentuk polong.",
    },
    info: {
      asal: "Banyak ditanam di lahan kering Tuban, Wonogiri, dan Lombok.",
      manfaat: "Sumber protein nabati dan lemak sehat.",
      ekosistem:
        "Bakteri di bintil akarnya mengikat nitrogen sehingga menyuburkan tanah.",
      fakta: "Bunganya di atas tanah, tetapi polongnya tumbuh di dalam tanah.",
    },
  },
  {
    id: "terong",
    name: "Terong Ungu",
    latin: "Solanum melongena",
    seasons: ["pancaroba", "kemarau"],
    seedPrice: 25,
    sellPrice: 60,
    days: 7,
    waterEvery: 1,
    shape: "bush",
    produce: "#6b3fa0",
    leaf: "#3f8a45",
    care: {
      kind: "interval",
      every: 3,
      label: "Beri Pupuk Kompos",
      desc: "Berbuah terus-menerus sehingga butuh pupuk kompos setiap 3 hari.",
      usesPupuk: true,
    },
    info: {
      asal: "Ditanam di dataran rendah seluruh Indonesia.",
      manfaat: "Rendah kalori dan mengandung nasunin (antioksidan).",
      ekosistem: "Bunganya diserbuki lebah tukang kayu (Xylocopa).",
      fakta: "Terong satu keluarga dengan tomat, cabai, dan kentang.",
    },
  },
]

export const CROP_MAP: Record<string, CropDef> = Object.fromEntries(
  CROPS.map((c) => [c.id, c]),
)

export const PUPUK_PRICE = 15
export const CAN_CAPACITY = 20
export const MAX_ENERGY = 100
export const DAY_START = 6 * 60
export const DAY_END = 26 * 60 // 02:00

export type ToolId = "cangkul" | "penyiram" | "sabit" | "beliung" | "bibit" | "tangan"

export const TOOLS: {
  id: ToolId
  name: string
  energy: number
  desc: string
}[] = [
  {
    id: "cangkul",
    name: "Cangkul",
    energy: 3,
    desc: "Olah tanah. Cangkul 2x untuk guludan.",
  },
  {
    id: "penyiram",
    name: "Penyiram",
    energy: 1,
    desc: "Siram petak. Isi ulang di sumur.",
  },
  {
    id: "sabit",
    name: "Sabit",
    energy: 2,
    desc: "Babat rumput liar & tanaman layu.",
  },
  {
    id: "beliung",
    name: "Beliung",
    energy: 4,
    desc: "Hancurkan batu di lahan.",
  },
  {
    id: "bibit",
    name: "Bibit",
    energy: 1,
    desc: "Tanam bibit terpilih (Q ganti bibit).",
  },
  {
    id: "tangan",
    name: "Tangan",
    energy: 1,
    desc: "Panen, Rawat(), dan interaksi.",
  },
]

export function seasonAt(day: number) {
  const idx = Math.floor((day - 1) / DAYS_PER_SEASON) % SEASON_CYCLE.length
  return {
    ...SEASON_CYCLE[idx],
    index: idx,
    dayOf: ((day - 1) % DAYS_PER_SEASON) + 1,
  }
}

export function formatTime(min: number) {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
