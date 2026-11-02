
const WIDTH = 1000
const HEIGHT = 562.5
function fitStage() {
    const stage = document.getElementById("stage")
    if (!stage) return

    const pad = 2 * parseFloat(getComputedStyle(document.body).paddingTop) || 0
    const maxW = window.innerWidth - pad
    const maxH = window.innerHeight - pad

    const s = Math.min(maxW / WIDTH, maxH / HEIGHT)
    stage.style.zoom = String(s)
    stage.style.transform = ""
}

fitStage()
window.addEventListener("resize", fitStage)