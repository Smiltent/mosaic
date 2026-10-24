
import { Hono } from "hono"

import rootRoute from "@/routes/root.route.ts"

export default class Honoo {
    private app: Hono

    constructor() {
        this.app = new Hono()

        this.routes()
        this.start()
    }

    private routes() {
        this.app.route("/", rootRoute)
    }

    private start() {
        Deno.serve(this.app.fetch)
    }
}