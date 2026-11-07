
import { createGame } from "@/src/client/handlers/game.ts"
import { loadPacks } from "@/src/client/utils/bricks.ts"
import { createHud } from "@/src/client/ui/hud.ts"

const roomId = (document.body.dataset.room ?? "").trim()
if (!roomId) window.location.href = "/"

const canvas = document.getElementById("game") as HTMLCanvasElement

loadPacks().then(() => {
    const game = createGame(canvas)

    createHud((id) => {
        game.setSelectedBlock(id)
    })
})

