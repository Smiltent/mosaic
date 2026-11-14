
import { getSession } from "@/src/server/auth.ts"
import { Context, Hono } from "hono"
import User from "@/models/User.ts"
import ejs from "ejs"

const router = new Hono()

async function clientScript(prefix: string) {
    for await (const f of Deno.readDir("public/js")) {
        if (f.name.startsWith(`${prefix}.`)) return `/js/${f.name}`
    }

    throw new Error("no client bundle!!!")
}

async function spaRender(c: Context, view: string, title: string, data: Record<string, unknown> = {}) {
    c.header("Vary", "X-SPA")

    if (c.req.header("X-SPA") === "1") {
        c.header("Cache-Control", "no-store")
        c.header("X-Title", title)

        return c.html(await ejs.renderFile(`views/${view}`, { capUrl: process.env.CAP_URL, ...data} ))
    }

    return c.html(await ejs.renderFile("views/index.ejs", {
        view, title, global: await clientScript("global"), capUrl: process.env.CAP_URL, ...data
    }))
}

router.get("/", async (c) => {
    if (await getSession(c)) return c.redirect("/lobby")
    c.redirect("/login")
})

router.get("/login", async (c) => {
    if (await getSession(c)) return c.redirect("/lobby")
    return spaRender(c, "menus/auth/login.ejs", "Login")
})

router.get("/register", async (c) => {
    if (await getSession(c)) return c.redirect("/lobby")
    return spaRender(c, "menus/auth/register.ejs", "Register")
})

router.get("/verify", async (c) => {
    if (!await getSession(c)) return c.redirect("/login")
    return spaRender(c, "menus/auth/verify.ejs", "Verify")
})

router.get("/forgot", (c) => spaRender(c, "menus/auth/forgot.ejs", "Forgot password"))
router.get("/reset", (c) => spaRender(c, "menus/auth/reset.ejs", "Reset password"))

router.get("/lobby", async (c) => {
    const id = await getSession(c)
    const user = id && await User.findById(id)
    if (!user) return c.redirect("/login")

    return spaRender(c, "menus/lobby.ejs", "Lobby", { user })
})

router.get("/game/:id", async (c) => {
    if (!await getSession(c)) return c.redirect("/login")
    return c.html(await ejs.renderFile("views/game.ejs", { script: await clientScript("game"), global: await clientScript("global"), id: c.req.param("id") }))
})

export default router