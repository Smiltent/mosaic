
import { Player } from "@/src/shared/player.ts"

export type ClientMessage =
    | { type: "place", layer: number, x: number, y: number, tile: number }
    | { type: "input", left: boolean, right: boolean, up: boolean, down: boolean, space: boolean }

export type ServerMessage =
    | { type: "init", id: number, x: number, y: number, color: string, w: number, h: number, world: Uint16Array[], players: Player[] }
    | { type: "place", layer: number, x: number, y: number, tile: number }
    | { type: "join", id: number, x: number, y: number, color: string }
    | { type: "moves", players: { id: number, x: number, y: number, speedX: number, speedY: number }[] }
    | { type: "leave", id: number }