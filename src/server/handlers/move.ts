
import { ClientMessage } from "@/src/shared/messages.ts"
import { WSPlayer } from "@/src/server/room.ts"

export function handleInput(p: WSPlayer, msg: Extract<ClientMessage, { type: "input"}>) {
    p.input.left = msg.left
    p.input.right = msg.right
    p.input.up = msg.up
    p.input.down = msg.down
    p.input.space = msg.space
}