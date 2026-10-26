
import { Hono } from "hono"
import ejs from "ejs"

const router = new Hono()

async function clientScript() {
    for await (const f of Deno.readDir("public/js")) {
        if (f.name.startsWith("client.")) return `/js/${f.name}`
    }

    throw new Error("no client bundle!!!")
}

router.get("/", async (c) => {
    return c.html(await ejs.renderFile("index.ejs", { script: await clientScript() }))
})

export default router