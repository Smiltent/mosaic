
import { ClientMessage } from "@/src/shared/messages.ts"
import { Room, WSPlayer } from "@/src/server/room.ts"

export function handleMove(room: Room, p: WSPlayer, msg: Extract<ClientMessage, { type: "move"}>) {
    p.x = msg.x
    p.y = msg.y
    p.speedX = msg.speedX
    p.speedY = msg.speedY

    room.broadcast({
        type: "move",
        id: p.id,
        x: p.x,
        y: p.y,
        speedX: p.speedX,
        speedY: p.speedY
    }, p.id)
}