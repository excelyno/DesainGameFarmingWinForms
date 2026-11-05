import {
  CAN_CAPACITY,
  CROP_MAP,
  CROPS,
  DAY_START,
  MAX_ENERGY,
  type ToolId,
  seasonAt,
} from "./data"

export type TileKind = "grass" | "soil" | "rock" | "weed" | "water"

export type PlantState = {
  cropId: string
  age: number
  watered: boolean
  dryDays: number
  cared: boolean
  lastCare: number
  quality: 1 | 2 | 3
}

export type TileState = {
  id: number
  kind: TileKind
  tilled: 0 | 1 | 2
  plant?: PlantState
}

export type GameState = {
  day: number
  time: number
  energy: number
  water: number
  coins: number
  selectedTool: ToolId
  selectedSeed: string
  tiles: TileState[]
  seeds: Record<string, number>
  harvest: Record<string, number>
  fertilizer: number
  discovered: string[]
  weather: "cerah" | "berawan" | "hujan"
  message: string
  journal: string[]
}

export type GameAction = {
  type: "SELECT_TOOL"
  tool: ToolId
} | {
  type: "SELECT_SEED"
  cropId: string
} | {
  type: "USE_TILE"
  tileId: number
} | {
  type: "BUY_SEED"
  cropId: string
} | {
  type: "SELL"
  cropId: string
} | { type: "END_DAY" } | {
  type: "RESTORE"
  state: GameState
}

const initialKinds: TileKind[] = [
  "weed",
  "grass",
  "grass",
  "rock",
  "grass",
  "grass",
  "weed",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "rock",
  "grass",
  "grass",
  "grass",
  "grass",
  "weed",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "rock",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "weed",
  "grass",
  "grass",
  "grass",
  "rock",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "weed",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
]

export function createGame(): GameState {
  return {
    day: 1,
    time: DAY_START,
    energy: MAX_ENERGY,
    water: CAN_CAPACITY,
    coins: 180,
    selectedTool: "cangkul",
    selectedSeed: "bayam",
    tiles: initialKinds.map((kind, id) => ({ id, kind, tilled: 0 })),
    seeds: Object.fromEntries(
      CROPS.map((crop) => [crop.id, crop.id === "bayam" ? 4 : 0]),
    ),
    harvest: Object.fromEntries(CROPS.map((crop) => [crop.id, 0])),
    fertilizer: 2,
    discovered: ["bayam"],
    weather: "cerah",
    message: "Warisan kecil, harapan besar. Bersihkan lahan pertamamu.",
    journal: ["Hari 1 — Tiba di Desa Sukamaju."],
  }
}

const toolCost: Record<ToolId, number> = {
  cangkul: 3,
  penyiram: 1,
  sabit: 2,
  beliung: 4,
  bibit: 1,
  tangan: 1,
}

function advance(state: GameState, energy: number, message: string): GameState {
  return {
    ...state,
    energy: Math.max(0, state.energy - energy),
    time: state.time + 10,
    message,
  }
}

function updateTile(
  state: GameState,
  tile: TileState,
  energy: number,
  message: string,
): GameState {
  return advance(
    {
      ...state,
      tiles: state.tiles.map((item) => (item.id === tile.id ? tile : item)),
    },
    energy,
    message,
  )
}

function useTile(state: GameState, tileId: number): GameState {
  const tile = state.tiles.find((item) => item.id === tileId)
  if (!tile) return state
  const tool = state.selectedTool
  if (state.energy < toolCost[tool])
    return {
      ...state,
      message: "Energi habis. Saatnya pulang dan beristirahat.",
    }

  if (tool === "cangkul") {
    if (tile.kind !== "grass" && tile.kind !== "soil") {
      return {
        ...state,
        message: "Bersihkan penghalang sebelum mencangkul petak ini.",
      }
    }
    if (tile.plant) return { ...state, message: "Ada tanaman di petak ini." }
    const tilled = Math.min(2, tile.tilled + 1) as 1 | 2
    return updateTile(
      state,
      { ...tile, kind: "soil", tilled },
      toolCost[tool],
      tilled === 2
        ? "Guludan siap untuk tanaman umbi."
        : "Tanah gembur dan siap ditanami.",
    )
  }

  if (tool === "sabit") {
    if (tile.kind === "weed" || (tile.plant && tile.plant.dryDays >= 3)) {
      return updateTile(
        state,
        { ...tile, kind: "grass", tilled: 0, plant: undefined },
        toolCost[tool],
        "Lahan kembali bersih.",
      )
    }
    return {
      ...state,
      message: "Sabit dipakai untuk rumput liar atau tanaman yang layu.",
    }
  }

  if (tool === "beliung") {
    if (tile.kind === "rock") {
      return updateTile(
        state,
        { ...tile, kind: "grass" },
        toolCost[tool],
        "Batu pecah. Sekarang petak bisa diolah.",
      )
    }
    return { ...state, message: "Tidak ada batu di petak ini." }
  }

  if (tool === "penyiram") {
    if (state.water <= 0)
      return {
        ...state,
        message: "Penyiram kosong. Dekati sumur dan tekan E untuk mengisi air.",
      }
    if (tile.kind !== "soil" || !tile.tilled)
      return {
        ...state,
        message: "Air hanya dibutuhkan petak yang sudah diolah.",
      }
    if (tile.plant?.watered)
      return { ...state, message: "Tanaman ini sudah disiram hari ini." }
    const next = updateTile(
      { ...state, water: state.water - 1 },
      {
        ...tile,
        plant: tile.plant ? { ...tile.plant, watered: true } : undefined,
      },
      toolCost[tool],
      "Tanah tersiram merata.",
    )
    return next
  }

  if (tool === "bibit") {
    const crop = CROP_MAP[state.selectedSeed]
    if (!crop || (state.seeds[crop.id] ?? 0) <= 0)
      return {
        ...state,
        message: `Bibit ${crop?.name ?? ""} habis. Kunjungi toko bibit.`,
      }
    if (!tile.tilled || tile.kind !== "soil" || tile.plant)
      return {
        ...state,
        message: "Bibit perlu petak kosong yang sudah dicangkul.",
      }
    if (!crop.seasons.includes(seasonAt(state.day).id))
      return {
        ...state,
        message: `${crop.name} tidak cocok ditanam pada musim ini.`,
      }
    if (crop.requiresGuludan && tile.tilled < 2)
      return {
        ...state,
        message: `${crop.name} memerlukan guludan. Cangkul petak sekali lagi.`,
      }
    return updateTile(
      {
        ...state,
        seeds: { ...state.seeds, [crop.id]: state.seeds[crop.id] - 1 },
        discovered: state.discovered.includes(crop.id)
          ? state.discovered
          : [...state.discovered, crop.id],
      },
      {
        ...tile,
        plant: {
          cropId: crop.id,
          age: 0,
          watered: false,
          dryDays: 0,
          cared: crop.care.kind === "none",
          lastCare: 0,
          quality: 1,
        },
      },
      toolCost[tool],
      `${crop.name} ditanam. Rawat setiap hari agar hasilnya berkualitas.`,
    )
  }

  if (tool === "tangan" && tile.plant) {
    const crop = CROP_MAP[tile.plant.cropId]
    if (tile.plant.age >= crop.days) {
      const amount = crop.regrow ? 2 : 1
      const nextPlant = crop.regrow
        ? {
            ...tile.plant,
            age: Math.max(0, crop.days - crop.regrow),
            watered: false,
          }
        : undefined
      return updateTile(
        {
          ...state,
          harvest: {
            ...state.harvest,
            [crop.id]: state.harvest[crop.id] + amount,
          },
        },
        { ...tile, plant: nextPlant },
        toolCost[tool],
        `${crop.name} dipanen${
          amount > 1 ? ` ×${amount}` : ""
        }! Jual hasilnya di kios.`,
      )
    }
    if (crop.care.kind !== "none" && !tile.plant.cared) {
      if (
        crop.care.kind === "interval" &&
        crop.care.usesPupuk &&
        state.fertilizer <= 0
      ) {
        return { ...state, message: "Kompos habis. Beli lagi di toko." }
      }
      return updateTile(
        {
          ...state,
          fertilizer:
            crop.care.kind === "interval" && crop.care.usesPupuk
              ? state.fertilizer - 1
              : state.fertilizer,
        },
        {
          ...tile,
          plant: {
            ...tile.plant,
            cared: true,
            lastCare: state.day,
            quality: Math.min(3, tile.plant.quality + 1) as 2 | 3,
          },
        },
        toolCost[tool],
        `${crop.care.label} selesai. Peluang hasil berkualitas meningkat.`,
      )
    }
    return {
      ...state,
      message: `${crop.name} tumbuh ${tile.plant.age}/${crop.days} hari.`,
    }
  }

  return { ...state, message: "Tidak ada yang bisa dilakukan dengan alat ini." }
}

function endDay(state: GameState): GameState {
  const nextDay = state.day + 1
  const season = seasonAt(nextDay)
  const roll = ((nextDay * 37) % 100) / 100
  const weather: GameState["weather"] =
    roll < season.rain
      ? "hujan"
      : roll < season.rain + 0.25
        ? "berawan"
        : "cerah"
  let withered = 0
  const tiles = state.tiles.map((tile) => {
    if (!tile.plant) return tile
    const crop = CROP_MAP[tile.plant.cropId]
    const gotWater = tile.plant.watered || state.weather === "hujan"
    const dryDays = gotWater ? 0 : tile.plant.dryDays + 1
    if (dryDays >= 3) withered += 1
    const canGrow = gotWater || (crop.waterEvery === 2 && dryDays < 2)
    const intervalCareDue =
      crop.care.kind === "interval" &&
      nextDay - tile.plant.lastCare >= crop.care.every
    return {
      ...tile,
      plant: {
        ...tile.plant,
        age: canGrow ? Math.min(crop.days, tile.plant.age + 1) : tile.plant.age,
        watered: weather === "hujan",
        dryDays,
        cared: intervalCareDue ? false : tile.plant.cared,
        quality: dryDays > 0 ? 1 : tile.plant.quality,
      },
    }
  })
  return {
    ...state,
    day: nextDay,
    time: DAY_START,
    energy: MAX_ENERGY,
    water: CAN_CAPACITY,
    weather,
    tiles,
    message: withered
      ? `${withered} tanaman layu. Gunakan sabit untuk membersihkannya.`
      : `Hari ${nextDay} dimulai. Cuaca hari ini ${weather}.`,
    journal: [
      ...state.journal.slice(-5),
      `Hari ${nextDay} — ${
        weather === "hujan"
          ? "Hujan menyirami lahan."
          : "Pagi baru di Desa Sukamaju."
      }`,
    ],
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SELECT_TOOL":
      return {
        ...state,
        selectedTool: action.tool,
        message: `${
          action.tool === "bibit"
            ? "Pilih bibit di tas (B), lalu Spasi di depan petak."
            : "Alat siap digunakan."
        }`,
      }
    case "SELECT_SEED":
      return {
        ...state,
        selectedSeed: action.cropId,
        selectedTool: "bibit",
        message: `Bibit ${CROP_MAP[action.cropId].name} dipilih.`,
      }
    case "USE_TILE":
      return useTile(state, action.tileId)
    case "BUY_SEED": {
      const crop = CROP_MAP[action.cropId]
      if (state.coins < crop.seedPrice)
        return { ...state, message: "Koinmu belum cukup." }
      return {
        ...state,
        coins: state.coins - crop.seedPrice,
        seeds: { ...state.seeds, [crop.id]: state.seeds[crop.id] + 1 },
        message: `Membeli 1 bibit ${crop.name}.`,
      }
    }
    case "SELL": {
      const crop = CROP_MAP[action.cropId]
      if (!state.harvest[crop.id]) return state
      return {
        ...state,
        coins: state.coins + crop.sellPrice,
        harvest: { ...state.harvest, [crop.id]: state.harvest[crop.id] - 1 },
        message: `${crop.name} terjual seharga ${crop.sellPrice} koin.`,
      }
    }
    case "END_DAY":
      return endDay(state)
    case "RESTORE":
      return action.state
    default:
      return state
  }
}
