
export function bootForm() {
    const form = document.getElementById("auth") as HTMLFormElement | null
    if (!form) return

    const err = document.getElementById("error")!

    form.addEventListener("submit", async (e) => {
        e.preventDefault()
        const res = await fetch(form.dataset.action!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(new FormData(form)))
        })

        if (res.ok) {
            location.href = form.dataset.next ?? "/lobby"
        } else {
            err.textContent = (await res.json()).error ?? "failed"
        }
    })
}