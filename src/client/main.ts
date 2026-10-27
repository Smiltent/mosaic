
import { createGame } from "@/src/client/handlers/game.ts"
import { createBlockBar } from "@/src/client/ui/blocks.ts"

const canvas = document.getElementById("game") as HTMLCanvasElement
const game = createGame(canvas)

createBlockBar((id) => {
    game.setSelectedBlock(id)
})