
function writeVarInt(out: number[], v: number) {
    while (v >= 0x80) {
        out.push((v & 0x7f) | 0x80)
        v >>>= 7
    }
    out.push(v)
}

function readVarInt(buf: Uint8Array, pos: { i: number }) {
    let v = 0, shift = 0, b = 0
    do {
        b = buf[pos.i++]
        v |= (b & 0x7f) << shift
        shift += 7
    } while (b & 0x80)
    return v
}

export function pack(tiles: ArrayLike<number>): Uint8Array {
    const palette: number[] = []
    const paletteIndex = new Map<number, number>()
    const body: number[] = []

    let i = 0
    while (i < tiles.length) {
        const tile = tiles[i]

        let pi = paletteIndex.get(tile)
        if (pi === undefined) {
            pi = palette.length
            palette.push(tile)
            paletteIndex.set(tile, pi)
        }

        let run = 1
        while (i + run < tiles.length && tiles[i + run] === tile) run++

        writeVarInt(body, pi)
        writeVarInt(body, run)
        i += run
    }

    const head: number[] = []
    writeVarInt(head, palette.length)
    for (const tile of palette) writeVarInt(head, tile)

    return Uint8Array.from([...head, ...body])
}

export function unpack(buf: Uint8Array): Uint16Array {
    const pos = { i: 0 }

    const paletteSize = readVarInt(buf, pos)
    const palette: number[] = []
    for (let k = 0; k < paletteSize; k++) palette.push(readVarInt(buf, pos))

    const tiles: number[] = []
    while (pos.i < buf.length) {
        const tile = palette[readVarInt(buf, pos)]
        let run = readVarInt(buf, pos)
        while (run-- > 0) tiles.push(tile)
    }

    return Uint16Array.from(tiles)
}
