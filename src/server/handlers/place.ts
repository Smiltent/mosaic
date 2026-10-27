
import { ClientMessage } from "@/src/shared/messages.ts"
import { Room } from "@/src/server/room.ts"

export function handlePlace(room: Room, msg: Extract<ClientMessage, { type: "place"}>) {
    const { layer, x, y, tile } = msg
    if (layer !== 0 && layer !== 1) return
    if (!room.world.setTile(layer, x, y, tile)) return

    room.broadcast({
        type: "place",
        layer,
        x, y,
        tile
    })
}