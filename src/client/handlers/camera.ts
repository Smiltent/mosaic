
import { SIZE } from "@/src/shared/world.ts"

const CAMERA_LAG = 1 / 16
const CAMERA_SNAP = 0.5

export let camX = 0
export let camY = 0

export function stepCamera(viewW: number, viewH: number, target: { x: number; y: number }) {
    const dx = target.x + SIZE / 2 - viewW / 2
    const dy = target.y + SIZE / 2 - viewH / 2

    camX -= (camX - dx) * CAMERA_LAG
    camY -= (camY - dy) * CAMERA_LAG

    if (Math.abs(camX - dx) < CAMERA_SNAP) camX = dx
    if (Math.abs(camY - dy) < CAMERA_SNAP) camY = dy
}

export function snapCamera(viewW: number, viewH: number, target: { x: number; y: number }) {
    camX = target.x + SIZE / 2 - viewW / 2
    camY = target.y + SIZE / 2 - viewH / 2
}