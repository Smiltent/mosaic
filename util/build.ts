
import * as esbuild from "esbuild"

export default async function build() {
    // if doesnt exist
    await Deno.mkdir("public/js", { recursive: true })

    for await (const f of Deno.readDir("public/js")) {
        await Deno.remove(`public/js/${f.name}`)
    }
    
    const entries = [
        { entry: "src/client/menu.ts", name: "menu" },
        { entry: "src/client/game.ts", name: "game" },
        { entry: "src/client/global.ts", name: "global" }
    ]
    
    for (const { entry, name } of entries) {
        const result = await esbuild.build({
            entryPoints: [entry],
            bundle: true,
            write: false,
            format: "iife",
            minify: process.env.NODE_ENV !== "dev",
            alias: { "@": new URL("../", import.meta.url).pathname }
        })

        const code = result.outputFiles[0].contents
        const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", code as BufferSource))
            .slice(0, 4)
            .reduce((s, b) => s + b.toString(16).padStart(2, "0"), "")

        await Deno.writeFile(`public/js/${name}.${hash}.js`, code)
    }

    esbuild.stop()
}
