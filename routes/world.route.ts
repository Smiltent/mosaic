
import worldTypes from "@/src/shared/definitions/worlds.json" with { type: "json" }
import { getSession } from "@/src/server/auth.ts"
import World from "@/models/World.ts"
import { Hono } from "hono"
import { pack } from "@/src/shared/pack.ts";

const router = new Hono()

router.post("/", async (c) => {
    const uid = await getSession(c)
    if (!uid) return c.json({ error: "not logged in" }, 401)

    const { name, type } = await c.req.json().catch(() => ({}))
    const def = worldTypes[String(type) as keyof typeof worldTypes]

    if (typeof name !== "string" || !name.trim() || name.length > 32 || !def) {
        return c.json({ error: "invalid name or type" }, 400)
    }

    const empty = Buffer.from(pack(new Array(def.w * def.h).fill(0)))
    const world = await World.create({
        name,
        owner: uid,
        type,
        width: def.w,
        height: def.h,
        layers: [empty, empty]
    })

    return c.json({ id: world.id })
})

export default router
