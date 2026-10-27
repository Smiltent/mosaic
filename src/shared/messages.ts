
import { Player } from "@/src/shared/player.ts"

export type ClientMessage =
    | { type: "place", layer: number, x: number, y: number, tile: number }
    | { type: "move", x: number, y: number, speedX: number, speedY: number }

export type ServerMessage =
    | { type: "init", id: number, x: number, y: number, color: string, world: number[][], players: Player[] }
    | { type: "place", layer: number, x: number, y: number, tile: number }
    | { type: "join", id: number, x: number, y: number, color: string }
    | { type: "move", id: number, x: number, y: number, speedX: number, speedY: number }
    | { type: "leave", id: number }