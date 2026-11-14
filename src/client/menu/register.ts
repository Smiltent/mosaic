
export function bootRegister() {
    const form = document.getElementById("auth") as HTMLFormElement
    const err = document.getElementById("err")!

    form.addEventListener("submit", async (e) => {
        e.preventDefault()
        const res = await fetch("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: form.username.value,
                password: form.password.value
            })
        })

        if (res.ok) {
            location.href = "/lobby"
        } else {
            err.textContent = (await res.json()).error ?? "Register Failed"
        }
    })
}