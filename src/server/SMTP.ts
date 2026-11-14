
import nodemailer from "nodemailer"

const transport = process.env.SMTP_HOST ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
}) : null

export async function sendCode(email: string, code: string, subject: string) {
    if (!transport) {
        console.log(`mail - no smtp configured - ${subject} to ${email} is ${code}`)
        return
    }

    await transport.sendMail({
        from: process.env.SMTP_FROM ?? "noreply@mosaic",
        to: email,
        subject,
        text: `Your code is ${code}. It expires in 10 minutes.`
    })
}