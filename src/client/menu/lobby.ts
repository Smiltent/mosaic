

let activeFilter = "online"
let searchQuery = ""

function filterGames() {
    document.querySelectorAll<HTMLDivElement>(".activeGames div.game").forEach((g) => {
        const matchesFilter =
            activeFilter === "online" ? Number(g.dataset.online) > 0 :
            activeFilter === "owned" ? g.dataset.owned === "1" :
            false

        const matchesSearch = !searchQuery ||
            (g.querySelector(".title p")?.textContent ?? "").toLowerCase().includes(searchQuery)

        g.style.display = matchesFilter && matchesSearch ? "" : "none"
    })
}

function bindGameClicks() {
    document.querySelectorAll<HTMLDivElement>(".activeGames div.game").forEach((elm) => {
        elm.addEventListener("click", () => {
            location.href = String(elm.dataset.gameRedirect)
        })
    })
}

export function bootLobby() {
    document.querySelectorAll<HTMLButtonElement>(".activeGamesButtons button").forEach((elm) => {
        elm.addEventListener("click", () => {
            document.querySelectorAll(".activeGamesButtons button").forEach((b) => b.classList.remove("active"))
            elm.classList.add("active")

            activeFilter = elm.dataset.filter!
            filterGames()
        })
    })

    document.querySelectorAll<HTMLButtonElement>(".extraInfoButtons button").forEach((elm) => {
        elm.addEventListener("click", () => {
            document.querySelectorAll(".extraInfoButtons button").forEach((b) => {
                b.classList.remove("active")
            })

            elm.classList.add("active")
        })
    })

    document.querySelectorAll<HTMLDivElement>(".activeGames div.game").forEach((elm) => {
        elm.addEventListener("click", () => {
            location.href = String(elm.dataset.gameRedirect)
        })
    })

    bindGameClicks()

    document.getElementById("search")?.addEventListener("input", (e) => {
        searchQuery = (e.target as HTMLInputElement).value.trim().toLowerCase()
        filterGames()
    })

    document.getElementById("refreshGames")?.addEventListener("click", async () => {
        const res = await fetch("/lobby", { headers: { "X-SPA": "1" }})
        if (!res.ok) return

        const fresh = new DOMParser().parseFromString(await res.text(), "text/html")
        const list = document.querySelector(".activeGames")
        const freshList = fresh.querySelector(".activeGames")

        if (list && freshList) {
            list.innerHTML = freshList.innerHTML
            bindGameClicks()
            filterGames()
        }
    })

    document.getElementById("githubBtn")?.addEventListener("click", (e) => {
        window.open("https://git.smilt.dev/smil/mosaic")
    })

    const next = document.getElementById("energyTimeNext")
    let secs = Number(next?.dataset.secs ?? 0)
    if (next && secs > 0) {
        const tick = () => {
            if (secs <= 0) return location.reload()
            next.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`
            secs--
        }

        tick()
        setInterval(tick, 1000)
    }

    const create = document.getElementById("createWorld") as HTMLFormElement
    create?.addEventListener("submit", async (e) => {
        e.preventDefault()

        const res = await fetch(create.dataset.action!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(new FormData(create)))
        })

        if (res.ok) {
            location.href = `/game/${(await res.json()).id}`
        }
    })
}

