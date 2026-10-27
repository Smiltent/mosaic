
import { ClientMessage } from "@/src/shared/messages.ts"
import { upgradeWebSocket } from "@hono/deno"
import { room } from "@/src/server/room.ts"
import { Hono } from "hono"

const router = new Hono()

router.get("/ws", upgradeWebSocket(() => {
    let id = 0

    return {
        onOpen(_e, ws) {
            id = room.connect(ws)
        },

        onMessage(e) {
            let msg: ClientMessage
            try {
                msg = JSON.parse(e.data.toString())
            } catch {
                return
            }

            room.handle(id, msg)
        },

        onClose() {
            room.disconnect(id)
        }
    }
}))

export default router