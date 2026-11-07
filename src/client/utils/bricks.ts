
import { SIZE, FG, BG } from "@/src/shared/world.ts"

export const PACKS = ["ee-default", "ee-modified"]

type DefFile = Record<string, {
    size: number
    padding?: number
    fg?: Record<string, string>
    bg?: Record<string, string>
}>

type Sprite = { img: HTMLImageElement, x: number, y: number, size: number }

const fg = new Map<number, Sprite>()
const bg = new Map<number, Sprite>()

export async function loadPacks(packs = PACKS) {
    for (let i = packs.length - 1; i >=0; i--) {
        let defs: DefFile
        try {
            defs = await (await fetch(`/packs/${packs[i]}/block-def.json`)).json()
        } catch { continue }

        for (const [file, def] of Object.entries(defs)) {
            const img = new Image()
            img.src = `/packs/${packs[i]}/assets/${file}`

            try {
                await img.decode()
            } catch { continue }

            const pad = def.padding ?? 0
            for (const [table, defTable] of [[fg, def.fg], [bg, def.bg]] as const) {
                for (const [id, pos] of Object.entries(defTable ?? {})) {
                    const [col, row] = pos.split(":").map(Number)
                    table.set(Number(id), {
                        img,
                        x: (col - 1) * (def.size + pad),
                        y: (row - 1) * (def.size + pad),
                        size: def.size
                    })
                }
            }
        }
    }
}

const cache = new Map<string, HTMLCanvasElement>()

function bake(id: number, layer: number) {
    const c = document.createElement("canvas")
    c.width = c.height = SIZE
    
    const g = c.getContext("2d")!
    const s = (layer === BG ? bg : fg).get(id) ?? fg.get(id) ?? fg.get(0) ?? bg.get(0)

    if (s) {
        g.drawImage(s.img, s.x, s.y, s.size, s.size, 0, 0, SIZE, SIZE)
        return c
    }

    const hue = (id * 47) % 360
    g.fillStyle = `hsl(${hue}, 50%, 45%)`
    g.fillRect(0, 0, SIZE, SIZE)
    g.fillStyle = `hsl(${hue}, 50%, 30%)`
    g.fillRect(0, SIZE - 1, SIZE, 1)
    g.fillRect(SIZE - 1, 0, 1, SIZE)

    return c
}

export function brickSprite(id: number, layer = FG) {
    const key = `${layer}:${id}`

    let c = cache.get(key)
    if (!c) cache.set(key, c = bake(id, layer))

    return c
}