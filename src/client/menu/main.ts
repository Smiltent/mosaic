
const NAMEKEY = "mosaic.username"
export function bootLobby() {
    const root = document.getElementById("lobby")!
    const sub = document.getElementById("lobby-subtext")!


    document.querySelectorAll<HTMLButtonElement>(".activeGamesButtons button").forEach((elm) => {
        elm.addEventListener("click", () => {
            document.querySelectorAll(".activeGamesButtons button").forEach((b) => {
                b.classList.remove("active")
            })

            elm.classList.add("active")
        })
    })
}

