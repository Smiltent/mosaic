
import blocks from "@/src/shared/definitions/blocks.json" with { type: "json" }
import { brickSprite } from "@/src/client/utils/bricks.ts"
import { FG, BG } from "@/src/shared/world.ts"

function parseRef(ref: string) {
    const [layer, id] = ref.split(".")
    return { id: Number(id), layer: layer === "bg" ? BG : FG }
}

const ALL_BLOCKS = Object.values(blocks).flat().map(parseRef)
const MAX_HOTBAR = 9

function btn(label: string, onClick: () => void) {
    const el = document.createElement("button")

    el.textContent = label
    el.onclick = onClick

    return el
}

export function createHud(onSelect: (id: number, layer: number) => void) {
    const left = document.getElementById("gui-left")
    const center = document.getElementById("gui-center")
    const right = document.getElementById("gui-right")

    left?.append(
        btn("Leave", () => location.href = "/lobby"),
        btn("Smiley", () => console.log("temp")),
        btn("Aura", () => console.log("temp")),
        btn("God", () => console.log("temp"))
    )

    // TODO : make functional
    const hotbar: number[] = JSON.parse(localStorage.getItem("hotbar") ?? "[1,2,3,4,5,6,7,8,9]")
    let selectedBtn: HTMLButtonElement | null = null

    const palette = document.createElement("div")
    palette.id = "palette"
    palette.hidden = true

    const bar = document.createElement("div")
    bar.id = "hotbar"

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

    for (const { id, layer } of ALL_BLOCKS) {
        const b = blockButton(id, layer)
        if (layer === BG) b.classList.add("bg")

        palette.append(b)
    }

    const row = document.createElement("div")
    row.id = "hotbarRow"

    const inventoryBtn = btn("Blocks", () => palette.hidden = !palette.hidden)
    row.append(bar, inventoryBtn)

    center?.append(palette, row)
    renderBar()

    addEventListener("keydown", (e) => {
        const i = Number(e.key) - 1
        if (i < 0 || i >= hotbar.length) return

        (bar.children[i] as HTMLButtonElement | undefined)?.click()
    })

    right?.append(
        btn("Settings", () => console.log("temp")),
        btn("Map", () => console.log("temp"))
    )
}