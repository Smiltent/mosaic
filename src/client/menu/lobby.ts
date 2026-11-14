
export function bootLobby() {
    document.querySelectorAll<HTMLButtonElement>(".activeGamesButtons button").forEach((elm) => {
        elm.addEventListener("click", () => {
            document.querySelectorAll(".activeGamesButtons button").forEach((b) => {
                b.classList.remove("active")
            })

            elm.classList.add("active")
        })
    })

    document.getElementById("githubBtn")?.addEventListener("click", (e) => {
        e.preventDefault()
    })
}

