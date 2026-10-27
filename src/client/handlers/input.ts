
import { Input } from "@/src/shared/player.ts"

export const input: Input = { left: false, right: false, up: false, down: false, space: false, justSpace: false }

function setKey(e: KeyboardEvent, down: boolean) {
    switch (e.code) {
        case "ArrowLeft": 
        case "KeyA": 
            input.left = down
            break

        case "ArrowRight": 
        case "KeyD": 
            input.right = down
            break

        case "ArrowUp": 
        case "KeyW": 
            input.up = down
            break

        case "ArrowDown": 
        case "KeyS": 
            input.down = down
            break

        case "Space": 
            if (down && !input.space) {
                input.justSpace = true
            }
            input.space = down
            break
    }
}

export function bindInput() {
    onkeydown = (e) => setKey(e, true)
    onkeyup = (e) => setKey(e, false)
}