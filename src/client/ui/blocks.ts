
import { brickSprite } from "@/src/client/bricks.ts"
import { Block } from "@/src/shared/blocks.ts"

const PLACEABLE = [
    { id: Block.Basic, label: "Basic" },

    { id: Block.GravityLeft, label: "Gravity ←" },
    { id: Block.GravityRight, label: "Gravity →" },
    { id: Block.GravityUp, label: "Gravity ↑" },
    { id: Block.GravityDown, label: "Gravity ↓" },
    { id: Block.GravityDot, label: "Gravity ·" },
    
    { id: Block.Water, label: "Water" },
    { id: Block.Mud, label: "Mud" },
    { id: Block.Lava, label: "Lava" },
    { id: Block.Toxic, label: "Toxic" },
    { id: Block.Spike, label: "Spike" }
]

export function createBlockBar(onSelect: (id: number) => void) {
    const gui = document.getElementById("gui")! as HTMLDivElement
    let selected = PLACEABLE[0].id

    for (const { id, label } of PLACEABLE) {
        const btn = document.createElement("button")
        btn.title = label
        btn.dataset.id = String(id)
        btn.append(brickSprite(id))
        btn.onclick = () => {
            selected = id
            for (const b of gui.querySelectorAll("button")) {
                b.classList.toggle("selected", b === btn)
            }
            onSelect(selected)
        }

        if (id === selected) btn.classList.add("selected")
        gui.append(btn)
    }

    onSelect(selected)
    return selected
}