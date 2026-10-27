
import rootRoute from "@/routes/root.route.ts"
import wsRoute from "@/routes/ws.route.ts"
import { serveStatic } from "@hono/deno"
import { Hono } from "hono"

export default class Honoo {
    private app: Hono

    constructor() {
        this.app = new Hono()

        this.app.use("/js/*", serveStatic({ root: "./public" }))
        this.app.use("/css/*", serveStatic({ root: "./public" }))

        this.routes()
        this.start()
    }

    private routes() {
        this.app.route("/", rootRoute)
        this.app.route("/", wsRoute)
    }

    private start() {
        Deno.serve(this.app.fetch)
    }
}