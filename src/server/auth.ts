
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie"
import { Context } from "hono"

function hex(a: Uint8Array) {
    return [...a].map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function derive(password: string, salt: Uint8Array) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
        "deriveBits"
    ])

    return new Uint8Array(await crypto.subtle.deriveBits({ 
        name: "PBKDF2", 
        hash: "SHA-256", 
        salt, 
        iterations: 100000 
    }, key, 256))
}

export async function hashPassword(password: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    return `${hex(salt)}:${hex(await derive(password, salt))}`
}

export async function verifyPassword(password: string, stored: string) {
    const [ saltHex, hash ] = stored.split(":")
    const salt = new Uint8Array(saltHex.match(/../g)!.map((b) => parseInt(b, 16)))

    return hex(await derive(password, salt)) === hash
}

export async function setSession(c: Context, uid: string) {
    await setSignedCookie(c, "session", uid, process.env.SESSION_SECRET!, {
        httpOnly: true,
        sameSite: "Lax",
        path: "/"
    })
}

export function clearSession(c: Context) {
    deleteCookie(c, "session", { path: "/" })
}

export async function getSession(c: Context) {
    return (await getSignedCookie(c, process.env.SESSION_SECRET!, "session")) || null
}