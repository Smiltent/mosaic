
import { ClientMessage, ServerMessage } from "@/src/shared/messages.ts"

export type MessageHandler = (msg: ServerMessage) => void
export function connect(onMessage: MessageHandler) {
    const ws = new WebSocket(`ws://${location.host}/ws`)

    ws.onmessage = (e) => {
        const msg = JSON.parse(e.data) as ServerMessage
        onMessage(msg)
    }

    return {
        send(msg: ClientMessage) {
            ws.send(JSON.stringify(msg))
        }
    }
}

export type Net = ReturnType<typeof connect>