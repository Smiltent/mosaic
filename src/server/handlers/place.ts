
import { ClientMessage } from "@/src/shared/messages.ts"
import { FG, MG } from "@/src/shared/world.ts"
import { Room } from "@/src/server/room.ts"

export function handlePlace(room: Room, msg: Extract<ClientMessage, { type: "place"}>) {
    const { layer, x, y, tile } = msg

    if (layer < 0 || layer > 2) return
    if (!room.world.setTile(layer, x, y, tile)) return

    room.markDirty()
    room.broadcast({
        type: "place",
        layer,
        x, y,
        tile
    })

    if (tile !== 0 && (layer === FG || layer === MG)) {
        const other = layer === FG ? MG : FG
        if (room.world.setTile(other, x, y, 0)) {
            room.broadcast({ type: "place", layer: other, x, y, tile: 0 })
        }
    }
}