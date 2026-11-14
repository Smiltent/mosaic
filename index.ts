
import Honoo from "@/src/server/Hono.ts"
import build from "@/util/build.ts"
import mongoose from "mongoose"

async function main() {
    await build()
    await mongoose.connect(process.env.MONGO_URI!)

    new Honoo()
}

await main()
