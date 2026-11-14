
export default async function captcha(token: string) {
    const url = process.env.CAP_URL
    const secret = process.env.CAP_SECRET

    if (!url || !secret || !token) return false

    const res = await fetch(`${url}/siteverify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
        signal: AbortSignal.timeout(5000)
    }).catch(() => null)

    return res?.ok === true && (await res.json().catch(() => null))?.success === true
}