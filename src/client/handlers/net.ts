
import { ClientMessage, ServerMessage } from "@/src/shared/messages.ts"
import { decodeServer, encodeClient } from "@/src/shared/proto.ts"

export type MessageHandler = (msg: ServerMessage) => void
export function connect(onMessage: MessageHandler) {
    const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws?world=${document.body.dataset.room}`)
    ws.binaryType = "arraybuffer"

    ws.onmessage = (e) => {
        if (typeof e.data === "string") return
        onMessage(decodeServer(e.data))
    }

    return {
        send(msg: ClientMessage) {
            ws.send(encodeClient(msg))
        }
    }
}

export type Net = ReturnType<typeof connect>
