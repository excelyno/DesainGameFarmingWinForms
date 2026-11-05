import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import {
  CAN_CAPACITY,
  CROP_MAP,
  CROPS,
  SEASON_LABEL,
  TOOLS,
  formatTime,
  seasonAt,
  type ToolId,
} from "./game/data"
import { createGame, gameReducer, type GameState } from "./game/engine"
import {
  FIELD,
  SPOTS,
  TILE,
  canWalk,
  createTerrain,
  drawScene,
  drawTool,
  frontTile,
  nearbySpot,
  type Facing,
  type Player,
} from "./game/world"

type Panel = "bag" | "book" | "shop" | "help" | "pause" | "sleep" | null
const SAVE_KEY = "tandur-world-v1"
const START: Player = { x: 735, y: 644, facing: "up", walking: false }
type Movement = {
  x: number
  y: number
  facing: Facing
}
const DIRECTIONS: Record<string, Movement> = {
  w: { x: 0, y: -1, facing: "up" },
  arrowup: { x: 0, y: -1, facing: "up" },
  s: { x: 0, y: 1, facing: "down" },
  arrowdown: { x: 0, y: 1, facing: "down" },
  a: { x: -1, y: 0, facing: "left" },
  arrowleft: { x: -1, y: 0, facing: "left" },
  d: { x: 1, y: 0, facing: "right" },
  arrowright: { x: 1, y: 0, facing: "right" },
}

function newGame() {
  const state: GameState = createGame()
  // An inherited garden: a few growing plants, and plenty of room to make it yours.
  state.tiles = state.tiles.map((tile): GameState["tiles"][number] => {
    if ([0, 1, 2, 8, 9, 10, 16, 17, 18].includes(tile.id))
      return {
        ...tile,
        kind: "soil",
        tilled: 1,
        plant: {
          cropId: "bayam",
          age: tile.id < 3 ? 3 : 1,
          watered: false,
          dryDays: 0,
          cared: true,
          lastCare: 1,
          quality: 1,
        },
      }
    if ([4, 5, 6, 12, 13, 14, 20, 21, 22].includes(tile.id))
      return { ...tile, kind: "soil", tilled: 1 }
    return tile
  })
  state.seeds.bayam = 8
  state.message = "Kebun kecil ini sekarang milikmu. Mau mulai dari mana?"
  return state
}

type SavedGame = {
  game: GameState
  player: Player
}

function loadGame(): SavedGame {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (
        saved.game?.tiles?.length === 48 &&
        typeof saved.player?.x === "number" &&
        canWalk(saved.player.x, saved.player.y)
      )
        return { game: saved.game, player: { ...saved.player, walking: false } }
    }
  } catch {
    /* A new garden is safer than a damaged save. */
  }
  return { game: newGame(), player: START }
}

function SpriteIcon({
  name,
  size = 32,
}: {
  name: ToolId | "coin" | "bag" | "book"
  size?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!.getContext("2d")!
    c.clearRect(0, 0, 28, 28)
    drawTool(c, name, 2, 1, 1)
  }, [name])
  return (
    <canvas
      ref={ref}
      width={28}
      height={28}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}

function App() {
  const [initial] = useState(loadGame)
  const [game, dispatch] = useReducer(gameReducer, initial.game)
  const player = useRef<Player>({ ...initial.player })
  const state = useRef(game)
  const [panel, setPanel] = useState<Panel>(null)
  const panelRef = useRef<Panel>(null)
  const [context, setContext] = useState<{
    tile: number | null
    spot: typeof SPOTS[number] | null
  }>({ tile: null, spot: null })
  const [notification, setNotification] = useState("")
  const [bookCrop, setBookCrop] = useState("bayam")
  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem(SAVE_KEY),
  )
  const [sound, setSound] = useState(false)
  const audio = useRef<AudioContext | null>(null)
  const keys = useRef(new Set<string>())
  const canvas = useRef<HTMLCanvasElement>(null)
  const viewport = useRef({ width: 960, height: 600, scale: 1 })
  const actionUntil = useRef(0)
  const [saved, setSaved] = useState(false)
  const season = seasonAt(game.day)
  const weekday = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
  ][(game.day - 1) % 7]
  state.current = game
  panelRef.current = panel

  const ping = useCallback(
    (frequency = 400) => {
      if (!sound) return
      try {
        audio.current ??= new AudioContext()
        const ctx = audio.current,
          osc = ctx.createOscillator(),
          gain = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(frequency, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(
          frequency * 0.55,
          ctx.currentTime + 0.12,
        )
        gain.gain.setValueAtTime(0.035, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.17)
      } catch {
        /* Sound is optional if the browser disallows audio. */
      }
    },
    [sound],
  )

  useEffect(() => {
    if (!notification) return
    const timer = window.setTimeout(() => setNotification(""), 3500)
    return () => window.clearTimeout(timer)
  }, [notification])
  useEffect(() => {
    if (game.message) setNotification(game.message)
  }, [game.message])
  useEffect(() => {
    const timer = window.setTimeout(() => setShowWelcome(false), 14000)
    return () => window.clearTimeout(timer)
  }, [])
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({ game: state.current, player: player.current }),
        )
      } catch {
        /* Private browsing may disable local saves. */
      }
    }
    const timer = window.setInterval(save, 4000)
    window.addEventListener("pagehide", save)
    return () => {
      save()
      window.clearInterval(timer)
      window.removeEventListener("pagehide", save)
    }
  }, [])

  const useAction = useCallback(
    (interact = false) => {
      if (panelRef.current || performance.now() < actionUntil.current) return
      const spot = nearbySpot(player.current)
      if (interact && spot) {
        setShowWelcome(false)
        if (spot.id === "home") setPanel("sleep")
        if (spot.id === "shop") setPanel("shop")
        if (spot.id === "well") {
          dispatch({
            type: "RESTORE",
            state: {
              ...state.current,
              water: CAN_CAPACITY,
              message: "Air dari sumur. Penyirammu sudah penuh.",
            },
          })
          ping(700)
        }
        if (spot.id === "sign") setPanel("help")
        return
      }
      const tile = frontTile(player.current)
      if (tile !== null) {
        actionUntil.current = performance.now() + 420
        dispatch({ type: "USE_TILE", tileId: tile })
        setShowWelcome(false)
        ping(state.current.selectedTool === "penyiram" ? 650 : 260)
      } else if (spot) {
        // Both action keys can interact with objects when no soil is in front.
        if (spot.id === "home") setPanel("sleep")
        else if (spot.id === "shop") setPanel("shop")
        else if (spot.id === "sign") setPanel("help")
        else
          dispatch({
            type: "RESTORE",
            state: {
              ...state.current,
              water: CAN_CAPACITY,
              message: "Penyiram terisi penuh.",
            },
          })
      } else
        setNotification("Dekati petak kebun, lalu hadapkan karakter ke tanah.")
    },
    [ping],
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (DIRECTIONS[key] || key === " ") e.preventDefault()
      if (DIRECTIONS[key] || key === "shift") keys.current.add(key)
      if (e.repeat) return
      if (key === "escape") {
        setPanel((p) => (p ? null : "pause"))
        return
      }
      if (panelRef.current) return
      if (key === " " || key === "f") useAction()
      if (key === "e") useAction(true)
      if (key === "b") setPanel("bag")
      if (key === "j") setPanel("book")
      if (key === "h") setPanel("help")
      if (key >= "1" && key <= "6")
        dispatch({ type: "SELECT_TOOL", tool: TOOLS[Number(key) - 1].id })
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase())
    const clear = () => keys.current.clear()
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", clear)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("blur", clear)
    }
  }, [useAction])

  useEffect(() => {
    const el = canvas.current!,
      c = el.getContext("2d")!
    const terrain = createTerrain()
    const resize = () => {
      const width = window.innerWidth,
        height = window.innerHeight
      // Render at native game pixels, then upscale without smoothing.
      const scale = Math.max(1.2, Math.min(2.4, width / 900))
      el.width = Math.ceil(width / scale)
      el.height = Math.ceil(height / scale)
      viewport.current = { width: el.width, height: el.height, scale }
      c.imageSmoothingEnabled = false
    }
    resize()
    window.addEventListener("resize", resize)
    let frame = 0,
      last = performance.now(),
      lastContext = ""
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04)
      last = now
      const p = player.current
      let dx = 0,
        dy = 0
      if (!panelRef.current && now > actionUntil.current) {
        for (const key of keys.current) {
          const d = DIRECTIONS[key]
          if (d) {
            dx += d.x
            dy += d.y
            p.facing = d.facing
          }
        }
      }
      p.walking = dx !== 0 || dy !== 0
      if (p.walking) {
        const speed =
          ((keys.current.has("shift") ? 155 : 106) * dt) /
          Math.max(1, Math.hypot(dx, dy))
        const canStep = (x: number, y: number) => {
          if (!canWalk(x, y)) return false
          const col = Math.floor((x - FIELD.x) / TILE),
            row = Math.floor((y - FIELD.y) / TILE)
          return (
            col < 0 ||
            col >= 8 ||
            row < 0 ||
            row >= 6 ||
            state.current.tiles[row * 8 + col].kind !== "rock"
          )
        }
        if (canStep(p.x + dx * speed, p.y)) p.x += dx * speed
        if (canStep(p.x, p.y + dy * speed)) p.y += dy * speed
      }
      const next = { tile: frontTile(p), spot: nearbySpot(p) }
      const signature = `${next.tile}-${next.spot?.id}`
      if (signature !== lastContext) {
        setContext(next)
        lastContext = signature
      }
      const v = viewport.current
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.fillStyle = "#708d53"
      c.fillRect(0, 0, el.width, el.height)
      c.translate(
        Math.round(v.width / 2 - p.x),
        Math.round(v.height / 2 - p.y + 18),
      )
      drawScene(
        c,
        terrain,
        state.current,
        p,
        now,
        Math.max(0, (actionUntil.current - now) / 420),
      )
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
    }
  }, [])

  const clickMap = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (panel) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const v = viewport.current,
      p = player.current
    const dx =
      ((event.clientX - bounds.left) / bounds.width) * v.width - v.width / 2
    const dy =
      ((event.clientY - bounds.top) / bounds.height) * v.height -
      v.height / 2 -
      18
    p.facing =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up"
    if (Math.hypot(dx, dy) < 65) useAction()
    else
      setNotification(
        "WASD / tombol arah untuk berjalan. Spasi untuk menggunakan alat.",
      )
  }

  const active = TOOLS.find((t) => t.id === game.selectedTool)!
  const front = context.tile === null ? null : game.tiles[context.tile]
  const crop = front?.plant ? CROP_MAP[front.plant.cropId] : null
  const actionLabel =
    crop &&
    front?.plant &&
    front.plant.age >= crop.days &&
    game.selectedTool === "tangan"
      ? "Panen"
      : active.name
  const saveNow = () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ game, player: player.current }),
    )
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <main className="world-game">
      <canvas
        ref={canvas}
        className="world-canvas"
        onClick={clickMap}
        aria-label="Dunia TANDUR. Bergerak dengan WASD atau tombol arah, Spasi untuk alat, E untuk berinteraksi."
      />
      <div className="scene-vignette" />
      <header className="world-heading">
        <div className="game-wordmark">
          tandur<span>SEBUAH CERITA DARI DESA</span>
        </div>
        <div className="location-tag">
          <i />
          Kebun Sukamaju<span>JAWA TIMUR</span>
        </div>
      </header>
      <aside className="game-hud">
        <div className="calendar-top">
          <span className={`pixel-sun weather-${game.weather}`} />
          <span>
            {season.name} · {game.weather}
          </span>
          <button aria-label="Menu permainan" onClick={() => setPanel("pause")}>
            Ⅱ
          </button>
        </div>
        <div className="calendar-day">
          <strong>
            {weekday}
            <span>Hari {game.day}</span>
          </strong>
          <b>{formatTime(game.time)}</b>
        </div>
        <div className="hud-bottom">
          <span>
            <SpriteIcon name="coin" size={23} />
            {game.coins.toLocaleString("id-ID")}
          </span>
          <div
            className="energy-display"
            title={`Energi ${game.energy} dari 100`}
          >
            <small>ENERGI</small>
            <div>
              <i style={{ width: `${game.energy}%` }} />
            </div>
          </div>
        </div>
      </aside>

      {showWelcome && (
        <section className="arrival-note">
          <button
            aria-label="Tutup petunjuk"
            onClick={() => setShowWelcome(false)}
          >
            ×
          </button>
          <small>RUMAH BARU, CERITA BARU</small>
          <h1>Selamat pagi, Petani.</h1>
          <p>
            Ini kebunmu. Tidak perlu terburu-buru.
            <br />
            Jelajahi, pilih alat, dan mulai menanam.
          </p>
          <span>
            <kbd>W A S D</kbd> Berjalan <b>·</b> <kbd>SPASI</kbd> Berkegiatan
          </span>
        </section>
      )}

      <div className="player-context" aria-live="polite">
        {context.spot ? (
          <>
            <kbd>E</kbd>
            <span>{context.spot.label}</span>
          </>
        ) : context.tile !== null ? (
          <>
            <kbd>SPASI</kbd>
            <span>
              {actionLabel}
              {crop ? ` · ${crop.name}` : " tanah"}
            </span>
          </>
        ) : (
          <span className="player-name">Petani Sukamaju</span>
        )}
      </div>

      <nav className="corner-controls" aria-label="Menu cepat">
        <button onClick={() => setPanel("book")} title="Jurnal tanaman (J)">
          <SpriteIcon name="book" size={27} />
          <kbd>J</kbd>
        </button>
        <button onClick={() => setPanel("bag")} title="Tas & bibit (B)">
          <SpriteIcon name="bag" size={27} />
          <kbd>B</kbd>
        </button>
        <button
          onClick={() => setPanel("help")}
          className="help-square"
          title="Panduan (H)"
        >
          ?<kbd>H</kbd>
        </button>
      </nav>

      <footer className="game-bottom">
        {notification && !panel && (
          <div className="world-toast" role="status">
            {notification}
          </div>
        )}
        <div className="tool-caption">
          <strong>
            {active.name === "Bibit"
              ? `Bibit ${CROP_MAP[game.selectedSeed].name}`
              : active.name}
          </strong>
          <span>
            {active.id === "penyiram"
              ? `Air ${game.water}/${CAN_CAPACITY}`
              : active.id === "bibit"
                ? `${game.seeds[game.selectedSeed]} di dalam tas`
                : "Gunakan di petak depanmu"}
          </span>
        </div>
        <div className="hotbar">
          {TOOLS.map((tool, index) => (
            <button
              key={tool.id}
              aria-label={`Pilih ${tool.name}`}
              aria-pressed={game.selectedTool === tool.id}
              className={game.selectedTool === tool.id ? "selected" : ""}
              onClick={() => {
                dispatch({ type: "SELECT_TOOL", tool: tool.id })
                ping(480 + index * 70)
              }}
              title={`${tool.name} [${index + 1}]`}
            >
              <kbd>{index + 1}</kbd>
              <SpriteIcon name={tool.id} size={39} />
              {tool.id === "bibit" && <em>{game.seeds[game.selectedSeed]}</em>}
            </button>
          ))}
          <span className="hotbar-divider" />
          <button
            aria-label="Buka tas"
            onClick={() => setPanel("bag")}
            title="Tas [B]"
          >
            <kbd>B</kbd>
            <SpriteIcon name="bag" size={37} />
          </button>
        </div>
        <div className="keyboard-guide">
          <span>
            <kbd>WASD</kbd> Bergerak
          </span>
          <i />
          <span>
            <kbd>SPASI</kbd> Gunakan alat
          </span>
          <i />
          <span>
            <kbd>E</kbd> Interaksi
          </span>
          <i />
          <span>
            <kbd>SHIFT</kbd> Lari
          </span>
        </div>
      </footer>

      <div className="touch-controls">
        <div className="dpad">
          {(["up", "left", "down", "right"] as const).map((dir) => (
            <button
              key={dir}
              className={`dpad-${dir}`}
              aria-label={`Berjalan ${dir}`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                keys.current.add(`arrow${dir}`)
              }}
              onPointerUp={() => keys.current.delete(`arrow${dir}`)}
              onPointerCancel={() => keys.current.delete(`arrow${dir}`)}
            >
              {{ up: "↑", left: "←", down: "↓", right: "→" }[dir]}
            </button>
          ))}
        </div>
        <div className="touch-actions">
          <button onClick={() => useAction(true)}>E</button>
          <button onClick={() => useAction()}>Alat</button>
        </div>
      </div>

      {panel && (
        <div
          className="game-overlay"
          onClick={(e) => e.currentTarget === e.target && setPanel(null)}
        >
          <section className={`game-window window-${panel}`}>
            <header>
              <span>
                {
                  {
                    bag: "Tas Petani",
                    book: "Jurnal Tanaman",
                    shop: "Kios Bu Sari",
                    help: "Hidup di Sukamaju",
                    pause: "Istirahat Sejenak",
                    sleep: "Pulang ke Rumah",
                  }[panel]
                }
              </span>
              <button onClick={() => setPanel(null)} aria-label="Tutup">
                ×
              </button>
            </header>
            {panel === "bag" && (
              <div className="window-content">
                <p className="window-intro">
                  Pilih bibit untuk ditanam. Gunakan tangan untuk memanen
                  hasilnya.
                </p>
                <div className="seed-grid">
                  {CROPS.map((c) => (
                    <button
                      key={c.id}
                      disabled={!game.seeds[c.id]}
                      className={game.selectedSeed === c.id ? "chosen" : ""}
                      onClick={() => {
                        dispatch({ type: "SELECT_SEED", cropId: c.id })
                        setPanel(null)
                      }}
                    >
                      <SpriteIcon name="bibit" />
                      <strong>{c.name}</strong>
                      <span>× {game.seeds[c.id]}</span>
                    </button>
                  ))}
                </div>
                <h3>Hasil kebun</h3>
                <div className="harvest-list">
                  {CROPS.some((c) => game.harvest[c.id]) ? (
                    CROPS.filter((c) => game.harvest[c.id]).map((c) => (
                      <span key={c.id}>
                        {c.name} <b>×{game.harvest[c.id]}</b>
                      </span>
                    ))
                  ) : (
                    <p>Belum ada hasil panen. Tanaman matang akan berkilau.</p>
                  )}
                </div>
                <small className="window-footnote">
                  Kompos: {game.fertilizer} · Kunjungi Bu Sari di sebelah barat
                  kebun untuk membeli bibit.
                </small>
              </div>
            )}
            {panel === "shop" && (
              <div className="window-content">
                <div className="shop-greeting">
                  <span>“Pagi! Mau menanam apa hari ini?”</span>
                  <strong>
                    <SpriteIcon name="coin" size={24} />
                    {game.coins}
                  </strong>
                </div>
                <div className="shop-items">
                  {CROPS.map((c) => (
                    <article key={c.id}>
                      <SpriteIcon name="bibit" />
                      <div>
                        <strong>{c.name}</strong>
                        <small>
                          {c.days} hari ·{" "}
                          {c.seasons.map((s) => SEASON_LABEL[s]).join(" / ")}
                        </small>
                      </div>
                      <button
                        disabled={game.coins < c.seedPrice}
                        onClick={() =>
                          dispatch({ type: "BUY_SEED", cropId: c.id })
                        }
                      >
                        Beli · {c.seedPrice}
                      </button>
                      {game.harvest[c.id] > 0 && (
                        <button
                          onClick={() =>
                            dispatch({ type: "SELL", cropId: c.id })
                          }
                        >
                          Jual · {c.sellPrice}{" "}
                          <small>({game.harvest[c.id]})</small>
                        </button>
                      )}
                    </article>
                  ))}
                </div>
                <p className="shop-feedback" role="status">
                  {game.message}
                </p>
              </div>
            )}
            {panel === "book" && (
              <div className="journal-layout">
                <nav>
                  {CROPS.map((c) => (
                    <button
                      className={bookCrop === c.id ? "active" : ""}
                      key={c.id}
                      onClick={() => setBookCrop(c.id)}
                    >
                      {c.name}
                      <span>›</span>
                    </button>
                  ))}
                </nav>
                <article>
                  <small>
                    TANAMAN NUSANTARA /{" "}
                    {String(
                      CROPS.findIndex((c) => c.id === bookCrop) + 1,
                    ).padStart(2, "0")}
                  </small>
                  <h2>{CROP_MAP[bookCrop].name}</h2>
                  <em>{CROP_MAP[bookCrop].latin}</em>
                  <p>{CROP_MAP[bookCrop].info.asal}</p>
                  <div className="journal-facts">
                    <span>
                      Panen<b>{CROP_MAP[bookCrop].days} hari</b>
                    </span>
                    <span>
                      Penyiraman
                      <b>Setiap {CROP_MAP[bookCrop].waterEvery} hari</b>
                    </span>
                    <span>
                      Musim
                      <b>
                        {CROP_MAP[bookCrop].seasons
                          .map((s) => SEASON_LABEL[s])
                          .join(", ")}
                      </b>
                    </span>
                  </div>
                  <h3>Merawat tanaman</h3>
                  <p>
                    {CROP_MAP[bookCrop].care.kind === "none"
                      ? "Cukup air dan tanah yang gembur. Tanaman ini tidak memerlukan perawatan khusus."
                      : (CROP_MAP[bookCrop].care as { desc: string }).desc}{" "}
                    {CROP_MAP[bookCrop].requiresGuludan &&
                      "Cangkul tanah dua kali untuk membuat guludan."}
                  </p>
                  <h3>Bagian dari kehidupan</h3>
                  <p>{CROP_MAP[bookCrop].info.ekosistem}</p>
                  <blockquote>{CROP_MAP[bookCrop].info.fakta}</blockquote>
                </article>
              </div>
            )}
            {panel === "help" && (
              <div className="window-content guide-content">
                <p className="window-intro">
                  Bukan sekadar kebun. Ini tempatmu menjalani hari.
                </p>
                <div className="guide-controls">
                  <span>
                    <kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd>
                    <b>Berjalan ke segala arah</b>
                  </span>
                  <span>
                    <kbd>1</kbd> — <kbd>6</kbd>
                    <b>Pilih alat di sabukmu</b>
                  </span>
                  <span>
                    <kbd>SPASI</kbd>
                    <b>Gunakan alat ke petak di depan</b>
                  </span>
                  <span>
                    <kbd>E</kbd>
                    <b>Bicara, isi air, atau pulang</b>
                  </span>
                  <span>
                    <kbd>B</kbd> / <kbd>J</kbd>
                    <b>Buka tas / jurnal tanaman</b>
                  </span>
                  <span>
                    <kbd>SHIFT</kbd>
                    <b>Berlari</b>
                  </span>
                </div>
                <ol className="farming-guide">
                  <li>
                    <SpriteIcon name="cangkul" />
                    <div>
                      <b>Siapkan tanah.</b>
                      <p>
                        Cangkul petak di kebun. Rumput liar perlu sabit, batu
                        perlu beliung.
                      </p>
                    </div>
                  </li>
                  <li>
                    <SpriteIcon name="bibit" />
                    <div>
                      <b>Tanam sesuatu.</b>
                      <p>
                        Tekan B, pilih bibit, lalu Spasi di petak kosong yang
                        sudah dicangkul.
                      </p>
                    </div>
                  </li>
                  <li>
                    <SpriteIcon name="penyiram" />
                    <div>
                      <b>Rawat setiap pagi.</b>
                      <p>
                        Siram tanaman. Isi air di sumur sebelah timur. Saat
                        matang, panen dengan tangan.
                      </p>
                    </div>
                  </li>
                </ol>
                <p className="window-footnote">
                  Rumah di barat laut untuk tidur. Bu Sari di barat daya untuk
                  membeli bibit dan menjual panen.
                </p>
              </div>
            )}
            {panel === "sleep" && (
              <div className="window-content rest-content">
                <span className="rest-moon">☾</span>
                <h2>Sudah cukup untuk hari ini?</h2>
                <p>
                  Tidur akan memulihkan energi.
                  <br />
                  Tanamanmu tumbuh selama kamu beristirahat.
                </p>
                <button
                  className="wood-button"
                  onClick={() => {
                    dispatch({ type: "END_DAY" })
                    player.current = {
                      x: 449,
                      y: 528,
                      facing: "down",
                      walking: false,
                    }
                    setPanel(null)
                    ping(520)
                  }}
                >
                  Tidur sampai pagi
                </button>
                <button className="plain-button" onClick={() => setPanel(null)}>
                  Masih ingin di luar
                </button>
              </div>
            )}
            {panel === "pause" && (
              <div className="window-content pause-content">
                <h2>Pelan-pelan saja.</h2>
                <p>Kebunmu tidak ke mana-mana.</p>
                <button className="wood-button" onClick={() => setPanel(null)}>
                  Kembali ke kebun
                </button>
                <button className="outline-button" onClick={saveNow}>
                  {saved ? "Permainan tersimpan" : "Simpan permainan"}
                </button>
                <button
                  className="outline-button"
                  onClick={() => setSound((v) => !v)}
                >
                  Suara alat: {sound ? "Aktif" : "Nonaktif"}
                </button>
                <button
                  className="plain-button"
                  onClick={() => setPanel("help")}
                >
                  Panduan bermain
                </button>
                <small>Tersimpan otomatis di browser ini.</small>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default App
