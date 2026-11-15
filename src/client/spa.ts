// deno-lint-ignore-file

import { bootLobby } from "@/src/client/menu/lobby.ts"
import { bootForm } from "@/src/client/menu/form.ts";

const stage = document.getElementById("stage")

function mount(path: string) {
    switch (path) {
        case "/login":
        case "/register": 
        case "/verify":
        case "/forgot":
        case "/reset":
            bootForm()
            break
        case "/lobby": 
            bootLobby() 
            break
    }
}

export async function navigate(url: string, push = true) {
    const target = new URL(url, location.origin)
    const path = target.pathname + target.search

    try {
        const res = await fetch(path, { headers: { "X-SPA": "1" }})
        if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`)

        const finalURL = new URL(res.url, location.origin)
        const finalPath = finalURL.pathname + finalURL.search
        if (!stage) throw new Error("no #stage")

        stage.innerHTML = await res.text()

        const title = res.headers.get("X-Title")
        if (title) {
            document.title = title
        }

        if (push) {
            history.pushState({}, "", finalPath)
        } else if (finalPath !== location.pathname + location.search) {
            history.replaceState({}, "", finalPath)
        }

        mount(finalURL.pathname)
    } catch (err) {
        console.error(`SPA nav failed: ${path}, err: ${err}`)
        location.href = url
    }
}

function shouldIntercept(a: HTMLAnchorElement, e: MouseEvent) {
    if (e.defaultPrevented) return false
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false
    if (a.target && a.target !== "_self") return false
    if (a.origin !== location.origin) return false

    const href = a.getAttribute("href") ?? ""
    if (!href || href.startsWith("#")) return false
    if (a.pathname.startsWith("/public")) return false
    // if (a.pathname.startsWith("/game")) return false

    return true
}

document.addEventListener("click", (e) => {
    const anchor = (e.target as HTMLElement).closest("a") as HTMLAnchorElement
    if (!anchor) return

    if (!shouldIntercept(anchor, e)) return

    const target = new URL(anchor.href)
    e.preventDefault()

    if (target.pathname === location.pathname && target.search === location.search) return
    navigate(target.href)

})

window.addEventListener("popstate", () => {
    navigate(location.href, false)
})

mount(location.pathname)