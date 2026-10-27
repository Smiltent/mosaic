
import { Player } from "@/src/shared/player.ts"
import { BG, FG, SIZE, World } from "@/src/shared/world.ts"
import { Net } from "@/src/client/handlers/net.ts"
import { layerOf } from "@/src/shared/blocks.ts";
import { tileAt } from "@/src/client/handlers/render.ts";

export type PaintState = {
    selectedBlock: number
    getMe: () => Player | null
}

// holy
function overlapsMe(me: Player, x: number, y: number) {
    return !!me && x * SIZE < me.x + SIZE && x * SIZE + SIZE > me.x && y * SIZE < me.y + SIZE && y * SIZE + SIZE > me.y
}

export function bindPaint(canvas: HTMLCanvasElement, world: World, net: Net, state: PaintState) {
    let painting = false
    let eraserLayer = FG
    let pastX = -1
    let pastY = -1
    let pastT = 0

    function placeAt(x: number, y: number, button: number) {
        const now = performance.now()
        if (x === pastX && y === pastY && now - pastT < 500) return
        pastX = x
        pastY = y
        pastT = now

        if (button === 2) {
            if (world.get(eraserLayer, x, y) !== 0) {
                net.send({ type: "place", layer: eraserLayer, x, y, tile: 0 })
            }
            return
        }

        const me = state.getMe()
        if (me && overlapsMe(me, x, y)) return
        
        const layer = layerOf(state.selectedBlock)
        if (world.get(layer, x, y) === state.selectedBlock) return
        
        net.send({ type: "place", layer, x, y, tile: state.selectedBlock })
    }

    canvas.onmousedown = (e) => {
        const { x, y } = tileAt(canvas, e)
        eraserLayer = world.get(FG, x, y) !== 0 ? FG : BG
        painting = true

        placeAt(x, y, e.button)
    }

    canvas.onmousemove = (e) => {
        if (!painting) return
        const { x, y } = tileAt(canvas, e)

        placeAt(x, y, e.button)
    }

    onmouseup = () => {
        painting = false
        pastX = pastY = -1
    }
    
    oncontextmenu = (e) => e.preventDefault()
}