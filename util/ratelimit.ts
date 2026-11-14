
import { Context, Next } from "hono"

export function ratelimit(windowMs: number, max: number) {
    const hits = new Map<string, number[]>()

    return async (c: Context, next: Next) => {
        const now = Date.now()
        const key = c.req.header("x-forwarded-for") ?? "local"
        const times = (hits.get(key) ?? []).filter((t) => now - t < windowMs)

        if (times.length >= max) {
            return c.json({ error: "too many attempts, try again later" }, 429)
        }

        times.push(now)
        hits.set(key, times)
        await next()
    }
}