
import blocks from "@/src/shared/definitions/blocks.json" with { type: "json" }
import { brickSprite } from "@/src/client/utils/bricks.ts"
import { FG, BG } from "@/src/shared/world.ts"

function parseRef(ref: string) {
    const [layer, id] = ref.split(".")
    return { id: Number(id), layer: layer === "bg" ? BG : FG }
}

const MAX_HOTBAR = 9

export function createHud(onSelect: (id: number, layer: number) => void) {
    const palette = document.getElementById("palette")!
    const bar = document.getElementById("hotbar")!

    document.getElementById("leaveBtn")!.onclick = () => location.href = "/lobby"
    document.getElementById("inventoryBtn")!.onclick = () => palette.hidden = !palette.hidden

    const tabBtns = [...document.getElementById("paletteButtons")!.children] as HTMLButtonElement[]
    const tabPages = [...document.getElementById("paletteBlocks")!.children] as HTMLElement[]

    tabPages.forEach((p, i) => p.hidden = i !== 0)
    tabBtns.forEach((b, i) => b.onclick = () => {
        tabBtns.forEach(t => t.classList.toggle("active", t === b))
        tabPages.forEach((p, j) => p.hidden = i !== j)
    })

    // TODO : make functional
    const hotbar: number[] = JSON.parse(localStorage.getItem("hotbar") ?? "[1,2,3,4,5,6,7,8,9]")
    let selectedBtn: HTMLButtonElement | null = null

    function select(b: HTMLButtonElement, id: number, layer: number) {
        selectedBtn?.classList.remove("selected")
        selectedBtn = b
        b.classList.add("selected")

        onSelect(id, layer)
    }

    function blockButton(id: number, layer: number) {
        const b = document.createElement("button")

        b.className = "block"
        b.title = `Block ${id}`
        b.append(brickSprite(id, layer))
        b.onclick = () => select(b, id, layer)

        return b
    }

    function renderBar() {
        bar.replaceChildren()

        for (let i = 0; i < MAX_HOTBAR; i++) {
            const id = hotbar[i]
            if (id === undefined) {
                const empty = document.createElement("button")
                empty.className = "block empty"
                empty.disabled = true
                bar.append(empty)

                continue
            }

            const b = blockButton(id, FG)
            if (id === 0 || !selectedBtn) select(b, id, FG)

            bar.append(b)
        }
    }

    for (const [category, subs] of Object.entries(blocks)) {
        const page = document.getElementById(`paletteBlocks${category[0].toUpperCase()}${category.slice(1)}`)
        if (!page) continue

        for (const ref of Object.values(subs).flat()) {
            const { id, layer } = parseRef(ref)
            const b = blockButton(id, layer)
            if (layer === BG) b.classList.add("bg")

            page.append(b)
        }
    }

    renderBar()

    addEventListener("keydown", (e) => {
        const i = Number(e.key) - 1
        if (i < 0 || i >= hotbar.length) return

        (bar.children[i] as HTMLButtonElement | undefined)?.click()
    })
}