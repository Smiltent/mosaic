
import { Player } from "@/src/shared/player.ts"

export type ClientMessage =
    | { type: "place", x: number, y: number, tile: number }
    | { type: "move", x: number, y: number }

export type ServerMessage =
    | { type: "init", id: number, width: number; height: number; tiles: number[]; players: Player[] }
    | { type: "place", x: number, y: number, tile: number }
    | { type: "join", id: number, x: number, y: number, color: string }
    | { type: "move", id: number, x: number, y: number }
    | { type: "leave", id: number }