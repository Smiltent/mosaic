
import { clearReset, clearSession, getSession, hashPassword, setReset, setSession, verifyPassword } from "@/src/server/auth.ts"
import { ratelimit } from "@/util/ratelimit.ts"
import { sendCode } from "@/src/server/SMTP.ts"
import captcha from "@/util/captcha.ts"
import User from "@/models/User.ts"
import { Hono } from "hono"

const router = new Hono()

const later = ratelimit(5 * 60 * 1000, 5)

const USERNAME = /^[a-zA-Z0-9_]{3,16}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_USERS_PER_EMAIL = 5
const CODE_TTS_MS = 10 * 60 * 1000

function sixDigits() {
    return String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0")
}

function validPass(p: unknown) {
    return typeof p === "string" && p.length >= 6
}

router.post("/login", later, async (c) => {
    if (await getSession(c)) return c.redirect("/lobby")

    const { username, password } = await c.req.json().catch(() => ({}))
    if (!username || !password) return c.json({ error: "missing username or password" }, 400)

    const user = await User.findOne({ username })
    if (!user || !(await verifyPassword(password, user.password))) return c.json({ error: "invalid username or password" }, 401)

    await setSession(c, user.id)
    return c.json({ ok: true })
})

router.post("/register", later, async (c) => {
    if (await getSession(c)) return c.redirect("/lobby")

    const body = await c.req.json().catch(() => ({}))
    const { username, email, password } = body

    if (!await captcha(body["cap-token"] ?? "")) return c.json({ error: "captcha failed" }, 403)

    if (!USERNAME.test(username ?? "")) return c.json({ error: "username must be 3-16 letters, numbers or _" }, 400)
    if (!EMAIL.test(email ?? "")) return c.json({ error: "invalid email" }, 400)
    if (!validPass(password)) return c.json({ error: "password must be at least 6 characters" }, 400)

    if (await User.countDocuments({ email }) >= MAX_USERS_PER_EMAIL) return c.json({ error: "too many accounts on this email" }, 409)
    if (await User.exists({ username })) return c.json({ error: "username taken" }, 409)

    const code = sixDigits()
    const user = await User.create({
        username, 
        email,
        password: await hashPassword(password),
        verifyCode: code,
        verifyExpires: new Date(Date.now() + CODE_TTS_MS)
    })

    await sendCode(email, code, "Verify your Mosaic account").catch((e) => console.error(`failed to send email: ${e}`))
    await setSession(c, user.id)
    return c.json({ ok: true })
})

router.post("/verify", later, async (c) => {
    const id = await getSession(c)
    const user = id && await User.findById(id)
    if (!user) return c.json({ error: "not logged in" }, 401)

    const { code } = await c.req.json().catch(() => ({}))
    if (!user.verifyCode || user.verifyCode !== code || !user.verifyExpires || user.verifyExpires < new Date()) return c.json({ error: "invalid or expired code" }, 400)

    user.verified = true
    user.verifyCode = undefined
    user.verifyExpires = undefined
    await user.save()

    return c.json({ ok: true })
})

router.post("/resend", ratelimit(5 * 60 * 1000, 1), async (c) => {
    const id = await getSession(c)
    const user = id && await User.findById(id)
    if (!user) return c.redirect("/login")

    if (!user.verified) {
        const code = sixDigits()
        user.verifyCode = code
        user.verifyExpires = new Date(Date.now() + CODE_TTS_MS)

        await user.save()
        await sendCode(user.email, code, "Verify your Mosaic account... again?").catch((e) => console.error(`failed to send email: ${e}`))
    }

    return c.redirect("/verify")
})

router.post("/forgot", later, async (c) => {
    const { username, email } = await c.req.json().catch(() => ({}))
    const user = username && email && await User.findOne({ username })

    if (user && user.email === email) {
        const code = sixDigits()
        user.resetCode = code
        user.resetExpires = new Date(Date.now() + CODE_TTS_MS)

        await user.save()
        await setReset(c, user.id)
        await sendCode(user.email, code, "Reset your Mosaic accounts password").catch((e) => console.error(`failed to send email: ${e}`))
    }

    return c.json({ ok: true })
})

router.post("/reset", later, async (c) => {
    const { username, code, password } = await c.req.json().catch(() => ({}))
    if (!validPass(password)) return c.json({ error: "password must be at least 6 characters" }, 400)

    const user = username && await User.findOne({ username })
    if (!user || !user.resetCode || user.resetCode !== code || !user.resetExpires || user.resetExpires < new Date()) return c.json({ error: "invalid or expired code" }, 400)

    user.password = await hashPassword(password)
    user.resetCode = undefined
    user.resetExpires = undefined
    await user.save()

    clearReset(c)
    await setSession(c, user.id)
    return c.json({ ok: true })
})

router.post("/logout", (c) => {
    clearSession(c)
    return c.redirect("/login")
})

export default router