
import { ClientMessage, ServerMessage } from "@/src/shared/messages.ts"
import { pack, unpack } from "@/src/shared/pack.ts"

class Writer {
    private buf = new Uint8Array(64)
    public len = 0

    private need(n: number) {
        if (this.len + n <= this.buf.length) return
        const next = new Uint8Array(Math.max(this.buf.length * 2, this.len + n))
        next.set(this.buf.subarray(0, this.len))
        this.buf = next
    }

    u8(v: number) { this.need(1); this.buf[this.len++] = v }
    u16(v: number) { this.need(2); this.buf[this.len++] = v & 0xff; this.buf[this.len++] = (v >> 8) & 0xff }
    u32(v: number) { this.need(4); new DataView(this.buf.buffer).setUint32(this.len, v, true); this.len += 4 }
    f32(v: number) { this.need(4); new DataView(this.buf.buffer).setFloat32(this.len, v, true); this.len += 4 }
    bytes(b: Uint8Array) { this.need(b.length); this.buf.set(b, this.len); this.len += b.length }
    str(s: string) { const b = new TextEncoder().encode(s); this.u16(b.length); this.bytes(b) }

    out(): Uint8Array<ArrayBuffer> { return this.buf.slice(0, this.len) }
}

class Reader {
    private view: DataView
    private pos = 0

    constructor(buf: ArrayBuffer | Uint8Array) {
        this.view = buf instanceof Uint8Array
            ? new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
            : new DataView(buf)
    }

    u8() { return this.view.getUint8(this.pos++) }
    u16() { const v = this.view.getUint16(this.pos, true); this.pos += 2; return v }
    u32() { const v = this.view.getUint32(this.pos, true); this.pos += 4; return v }
    f32() { const v = this.view.getFloat32(this.pos, true); this.pos += 4; return v }
    bytes(n: number) { const b = new Uint8Array(this.view.buffer, this.view.byteOffset + this.pos, n); this.pos += n; return b }
    str() { const n = this.u16(); const s = new TextDecoder().decode(this.bytes(n)); return s }
}

export function encodeClient(msg: ClientMessage): Uint8Array<ArrayBuffer> {
    const w = new Writer()

    switch (msg.type) {
        case "place":
            w.u8(0); w.u8(msg.layer); w.u16(msg.x); w.u16(msg.y); w.u16(msg.tile)
            break
        case "input":
            w.u8(1)
            w.u8((msg.left ? 1 : 0) | (msg.right ? 2 : 0) | (msg.up ? 4 : 0) | (msg.down ? 8 : 0) | (msg.space ? 16 : 0))
            break
    }

    return w.out()
}

export function decodeClient(buf: ArrayBuffer | Uint8Array): ClientMessage {
    const r = new Reader(buf)

    switch (r.u8()) {
        case 0: return { type: "place", layer: r.u8(), x: r.u16(), y: r.u16(), tile: r.u16() }
        case 1: {
            const f = r.u8()
            return { type: "input", left: !!(f & 1), right: !!(f & 2), up: !!(f & 4), down: !!(f & 8), space: !!(f & 16) }
        }
    }

    throw new Error("bad client opcode")
}

export function encodeServer(msg: ServerMessage): Uint8Array<ArrayBuffer> {
    const w = new Writer()

    switch (msg.type) {
        case "init":
            w.u8(0)
            w.u16(msg.id); w.f32(msg.x); w.f32(msg.y); w.str(msg.color)
            w.u16(msg.w); w.u16(msg.h)
            w.u8(msg.world.length)
            for (const layer of msg.world) {
                const p = pack(layer)
                w.u32(p.length); w.bytes(p)
            }
            w.u16(msg.players.length)
            for (const p of msg.players) {
                w.u16(p.id); w.f32(p.x); w.f32(p.y); w.f32(p.speedX); w.f32(p.speedY)
                w.u8(p.onGround ? 1 : 0); w.str(p.color)
            }
            break
        case "place":
            w.u8(1); w.u8(msg.layer); w.u16(msg.x); w.u16(msg.y); w.u16(msg.tile)
            break
        case "join":
            w.u8(2); w.u16(msg.id); w.f32(msg.x); w.f32(msg.y); w.str(msg.color)
            break
        case "moves":
            w.u8(3); w.u16(msg.players.length)
            for (const p of msg.players) {
                w.u16(p.id); w.f32(p.x); w.f32(p.y); w.f32(p.speedX); w.f32(p.speedY)
            }
            break
        case "leave":
            w.u8(4); w.u16(msg.id)
            break
    }

    return w.out()
}

export function decodeServer(buf: ArrayBuffer | Uint8Array): ServerMessage {
    const r = new Reader(buf)

    switch (r.u8()) {
        case 0: {
            const id = r.u16(), x = r.f32(), y = r.f32(), color = r.str()
            const w = r.u16(), h = r.u16()

            const layerCount = r.u8()
            const world: Uint16Array[] = []
            for (let i = 0; i < layerCount; i++) world.push(unpack(r.bytes(r.u32())))

            const playerCount = r.u16()
            const players = []
            for (let i = 0; i < playerCount; i++) {
                players.push({
                    id: r.u16(), x: r.f32(), y: r.f32(), speedX: r.f32(), speedY: r.f32(),
                    onGround: r.u8() === 1, color: r.str(),
                    jumpCount: 0, maxJumps: 1, lastJump: 0, tileQueue: [0, 0] as [number, number],
                })
            }

            return { type: "init", id, x, y, color, w, h, world, players }
        }
        case 1: return { type: "place", layer: r.u8(), x: r.u16(), y: r.u16(), tile: r.u16() }
        case 2: return { type: "join", id: r.u16(), x: r.f32(), y: r.f32(), color: r.str() }
        case 3: {
            const count = r.u16()
            const players = []
            for (let i = 0; i < count; i++) {
                players.push({ id: r.u16(), x: r.f32(), y: r.f32(), speedX: r.f32(), speedY: r.f32() })
            }
            return { type: "moves", players }
        }
        case 4: return { type: "leave", id: r.u16() }
    }

    throw new Error("bad server opcode")
}
