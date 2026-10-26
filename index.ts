
import Honoo from "@/src/server/Hono.ts"
import build from "@/util/build.ts"

async function main() {
    await build()
    new Honoo()
}

await main()
