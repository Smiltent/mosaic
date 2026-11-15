
import { ClientMessage, ServerMessage } from "@/src/shared/messages.ts"
import { createPlayer, Input, Player } from "@/src/shared/player.ts"
import { handlePlace } from "@/src/server/handlers/place.ts"
import { handleInput } from "@/src/server/handlers/move.ts"
import { MS_PER_TICK, World } from "@/src/shared/world.ts"
import { encodeServer } from "@/src/shared/proto.ts"
import { stepPlayer } from "@/src/shared/physics.ts"
import { pack, unpack } from "@/src/shared/pack.ts"
import WorldDoc from "@/models/World.ts"
import { WSContext } from "hono/ws"

export const rooms = new Map<string, Room>()
export const userSockets = new Map<string, WSContext>()

export interface WSPlayer extends Player {
    ws: WSContext
    input: Input
    spaceHeld: boolean
    moved: boolean
}

export class Room {
    public world: World
    public players = new Map<number, WSPlayer>()

    private nextId: number = 1
    private dirty: boolean = false
    private timer: ReturnType<typeof setInterval>
    private physics: ReturnType<typeof setInterval>
    private tickCount = 0

    constructor(public worldId: string, w: number, h: number, layers: Uint16Array[]) {
        this.world = new World(w, h)
        layers.forEach((tiles, i) => {
            this.world.layers[i]?.set(tiles)
        })

        this.timer = setInterval(() => this.save(), 15000)
        this.physics = setInterval(() => this.tick(), MS_PER_TICK)
    }

    private tick() {
        for (const p of this.players.values()) {
            const idle = !p.input.left && !p.input.right && !p.input.up && !p.input.down && !p.input.space
                && p.speedX === 0 && p.speedY === 0 && p.onGround
            if (idle) continue

            p.input.justSpace = p.input.space && !p.spaceHeld
            p.spaceHeld = p.input.space

            const ox = p.x, oy = p.y
            stepPlayer(p, p.input, this.world)
            if (p.x !== ox || p.y !== oy) p.moved = true
        }

        if (++this.tickCount % 6 === 0) {
            const moved = [...this.players.values()].filter(p => p.moved)
            if (moved.length) {
                this.broadcast({ 
                    type: "moves", players: moved.map(p => ({ id: p.id, x: p.x, y: p.y, speedX: p.speedX, speedY: p.speedY })) 
                })
                    
                for (const p of moved) {
                    p.moved = false
                }
            }
        }
    }

    public markDirty() {
        this.dirty = true
    }

    public async save() {
        if (!this.dirty) return

        this.dirty = false

        await WorldDoc.findByIdAndUpdate(this.worldId, { 
            layers: this.world.layers.map(l => Buffer.from(pack(l)))
        }).catch((e) => console.error(`world ${this.worldId} save failed: ${e}`))
    }

    public broadcast(msg: ServerMessage, except?: number) {
        const data = encodeServer(msg)
    
        for (const [id, p] of this.players) {
            if (id !== except) {
                p.ws.send(data)
            }
        }
    }

    public connect(ws: WSContext) {
        const id = this.nextId++
        const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
        const base = createPlayer(id, color)

        this.players.set(id, { ...base, ws, input: { left: false, right: false, up: false, down: false, space: false, justSpace: false }, spaceHeld: false, moved: false })
        const p = this.players.get(id)!

        ws.send(encodeServer({
            type: "init",
            id,
            x: p.x,
            y: p.y,
            w: this.world.width,
            h: this.world.height,
            color: p.color,
            world: this.world.layers,
            players: [...this.players].filter(([pid]) => pid !== id)
                .map(([pid, pl]) => ({ id: pid, x: pl.x, y: pl.y, speedX: pl.speedX, speedY: pl.speedY, onGround: pl.onGround, color: pl.color, jumpCount: 0, maxJumps: 1, lastJump: 0, tileQueue: [0, 0] }))
        }))

        this.broadcast({ type: "join", id, x: p.x, y: p.y, color: p.color }, id)
        return id
    }

    public async disconnect(id: number) {
        this.players.delete(id)
        this.broadcast({ type: "leave", id })

        if (this.players.size === 0) {
            clearInterval(this.timer)
            clearInterval(this.physics)

            await this.save()

            rooms.delete(this.worldId)
        }
    }

    public handle(id: number, msg: ClientMessage) {
        const p = this.players.get(id)
        if (!p) return

        if (msg.type === "place") {
            handlePlace(this, msg)
        } else if (msg.type === "input") {
            handleInput(p, msg)
        }
    }
}

export async function getRoom(worldId: string) {
    const cached = rooms.get(worldId)
    if (cached) return cached

    const doc = await WorldDoc.findById(worldId)
    if (!doc) return null

    const layers = (doc.layers as unknown as (Uint8Array | { buffer: Uint8Array })[])
        .map(l => unpack(l instanceof Uint8Array ? l : l.buffer))

    const room = new Room(worldId, doc.width ?? 25, doc.height ?? 25, layers)
    rooms.set(worldId, room)
    return room
}