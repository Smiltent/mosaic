

function btn(label: string, onClick: () => void ) {
    const el = document.createElement("button")

    el.textContent = label
    el.onclick = onClick

    return el
}

export function createHud(onSelect: (id: number) => void) {
    const left = document.getElementById("gui-left")
    const center = document.getElementById("gui-center")
    const right = document.getElementById("gui-right")

    left?.append(
        btn("Leave", () => console.log("temp")),
        btn("Smiley", () => console.log("temp")),
        btn("Aura", () => console.log("temp")),
        btn("God", () => console.log("temp"))
    )

    right?.append(
        btn("Settings", () => console.log("temp")),
        btn("Map", () => console.log("temp"))
    )
}