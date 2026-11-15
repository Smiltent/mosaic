
import { getRoom, Room, userSockets } from "@/src/server/room.ts"
import { ClientMessage } from "@/src/shared/messages.ts"
import { decodeClient } from "@/src/shared/proto.ts"
import { getSession } from "@/src/server/auth.ts"
import { upgradeWebSocket } from "@hono/deno"
import { WSContext } from "hono/ws"
import { Hono } from "hono"

const router = new Hono<{ Variables: { uid: string } }>()

router.get("/ws", 
    async (c, next) => {
        const uid = await getSession(c)
        if (!uid) return c.json({ error: "not logged in" }, 401)

        c.set("uid", uid)
        await next()
    },
    upgradeWebSocket((c) => {
        const uid = c.get("uid")
        
        let room: Room | null = null
        let sock: WSContext | null = null
        let id = 0

        return {
            async onOpen(_e, ws) {
                const worldId = c.req.query("world")
                room = worldId ? await getRoom(worldId) : null
                if (!room) return ws.close()

                userSockets.get(uid)?.close()
                userSockets.set(uid, ws)
                sock = ws

                id = room.connect(ws)
            },

            onMessage(e) {
                if (!room) return

                let msg: ClientMessage
                try {
                    msg = decodeClient(e.data as ArrayBuffer)
                } catch {
                    return
                }

                room.handle(id, msg)
            },

            onClose() {
                if (sock && userSockets.get(uid) === sock) {
                    userSockets.delete(uid)
                }

                room?.disconnect(id)
            }
        }
    }
))

export default router