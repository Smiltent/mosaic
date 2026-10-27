
import { snapCamera, stepCamera } from "@/src/client/handlers/camera.ts"
import { draw, resize, scale } from "@/src/client/handlers/render.ts"
import { bindInput, input } from "@/src/client/handlers/input.ts"
import { connect, Net } from "@/src/client/handlers/net.ts"
import { MS_PER_TICK, World } from "@/src/shared/world.ts"
import { bindPaint } from "@/src/client/handlers/paint.ts"
import { ServerMessage } from "@/src/shared/messages.ts"
import { stepPlayer } from "@/src/shared/physics.ts"
import { Player } from "@/src/shared/player.ts"

type RemotePlayer = Player & { tx: number, ty: number }

export function createGame(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!
    const world = new World()

    const others = new Map<number, RemotePlayer>()
    let me: Player | null = null

    let selectedBlock = 1
    let acc = 0

    let last = performance.now()
    let lastSent = 0

    const net: Net = connect(handleMessage)
    function handleMessage(msg: ServerMessage) {
        switch (msg.type) {
            case "init": 
                msg.world.forEach((tiles, layer) => world.layers[layer].set(tiles))
                me = { id: msg.id, x: msg.x, y: msg.y, speedX: 0, speedY: 0, onGround: false, jumpCount: 0, maxJumps: 1, lastJump: 0, tileQueue: [0, 0], color: msg.color }
                others.clear()

                for (const p of msg.players) {
                    others.set(p.id, { ...p, tx: p.x, ty: p.y })
                }

                {
                    const s = scale()
                    snapCamera(canvas.width / s, canvas.height / s, me)
                }
                break

            case "place":
                world.set(msg.layer, msg.x, msg.y, msg.tile)
                break

            case "join":
                others.set(msg.id, { ...msg, speedX: 0, speedY: 0, onGround: false, jumpCount: 0, maxJumps: 1, lastJump: 0, tileQueue: [0, 0], tx: msg.x, ty: msg.y })
                break

            // deno-lint-ignore no-case-declarations -- temp
            case "move":
                const p = others.get(msg.id)
                if (p) {
                    p.tx = msg.x
                    p.ty = msg.y
                }
                break
            
            case "leave":
                others.delete(msg.id)
                break
        }
    }

    function redraw() {
        draw(canvas, ctx, world, me, others.values())
    }

    function frame(now: number) {
        acc += now - last
        last = now

        // simulate less than 10t per frame
        acc = Math.min(acc, MS_PER_TICK * 15)

        const s = scale()
        const viewW = canvas.width / s
        const viewH = canvas.height / s

        while (acc >= MS_PER_TICK) {
            if (me) {
                stepPlayer(me, input, world)
                stepCamera(viewW, viewH, me)
            }

            acc -= MS_PER_TICK
            input.justSpace = false
        }

        for (const p of others.values()) {
            p.x += (p.tx - p.x) * 0.2
            p.y += (p.ty - p.y) * 0.2
        }

        if (me && now - lastSent > 66) {
            lastSent = now
            net.send({
                type: "move",
                x: me.x,
                y: me.y,
                speedX: me.speedX,
                speedY: me.speedY
            })
        }

        redraw()
        requestAnimationFrame(frame)
    }

    bindInput()
    bindPaint(canvas, world, net, {
        get selectedBlock() {
            return selectedBlock
        },
        getMe: () => me
    })

    onresize = () => resize(canvas, redraw)
    resize(canvas, redraw)
    requestAnimationFrame(frame)

    return {
        setSelectedBlock(id: number) {
            selectedBlock = id
        }
    }
}