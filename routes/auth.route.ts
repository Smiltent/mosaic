
import { getSession } from "@/src/server/auth.ts"
import { Context, Hono } from "hono"
import ejs from "ejs"

const router = new Hono()

router.post("/login", async (c) => {
    if (await getSession(c)) return c.redirect("/lobby")
})

router.post("/register", async (c) => {
    if (await getSession(c)) return c.redirect("/lobby")
})

export default router