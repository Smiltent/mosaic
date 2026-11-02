
import { Hono } from "hono"
import ejs from "ejs"

const router = new Hono()

async function clientScript(prefix: string) {
    for await (const f of Deno.readDir("public/js")) {
        if (f.name.startsWith(`${prefix}.`)) return `/js/${f.name}`
    }

    throw new Error("no client bundle!!!")
}

router.get("/", async (c) => {
    return c.html(await ejs.renderFile("views/index.ejs", { script: await clientScript("menu"), global: await clientScript("global") }))
})

router.get("/game/:id", async (c) => {
    return c.html(await ejs.renderFile("views/game.ejs", { script: await clientScript("game"), global: await clientScript("global"), id: c.req.param("id") }))
})

export default router