
import { createGame } from "@/src/client/handlers/game.ts"
import { createHud } from "@/src/client/ui/hud.ts"

const roomId = (document.body.dataset.room ?? "").trim()
if (!roomId) window.location = "/"

const canvas = document.getElementById("game") as HTMLCanvasElement
const game = createGame(canvas)

createHud((id) => {
    game.setSelectedBlock(id)
})