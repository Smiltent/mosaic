
import { upgradeWebSocket } from "@hono/deno"
import { WSContext } from "hono/ws"
import { Hono } from "hono"

const world = new Uint16Array(50 * 50)
const sockets = new Set<WSContext>()
const router = new Hono()

router.get("/", async (c) => {
    return c.html(await Deno.readTextFile(new URL("../index.html", import.meta.url)))
})

router.get("/ws", upgradeWebSocket(() => ({
    onOpen(e, ws) {
        sockets.add(ws)
        ws.send(JSON.stringify({
            type: "world",
            width: 50,
            height: 50,
            tiles: Array.from(world)
        }))
    },

    onMessage(e) {
        const msg = JSON.parse(e.data.toString())

        if (msg.type === "place") {
            const { x, y, tile } = msg

            if (x < 0 || x >= 50 || y < 0 || y >= 50) return
            world[y * 50 + x] = tile

            for (const s of sockets) {
                s.send(JSON.stringify({ type: "place", x, y, tile }))
            }
        }
    },

    onClose(e, ws) {
        sockets.delete(ws)
    }
})))

export default router