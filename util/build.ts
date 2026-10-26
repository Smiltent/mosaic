
import * as esbuild from "esbuild"

export default async function build() {
    const result = await esbuild.build({
        entryPoints: ["client/main.ts"],
        bundle: true,
        write: false,
        format: "iife",
        minify: process.env.NODE_ENV !== "dev"
    })

    const code = result.outputFiles[0].contents
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", code as BufferSource))
        .slice(0, 4)
        .reduce((s, b) => s + b.toString(16).padStart(2, "0"), "")

    // if doesnt exist
    await Deno.mkdir("public/js", { recursive: true })

    for await (const f of Deno.readDir("public/js")) {
        await Deno.remove(`public/js/${f.name}`)
    }

    await Deno.writeFile(`public/js/client.${hash}.js`, code)
    esbuild.stop()
}
