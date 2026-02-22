import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY ?? '')
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@readrise.app'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://readrise.app'

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to ReadRise, ${name}!`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:24px;margin-bottom:8px">Welcome to ReadRise, ${name}!</h1>
        <p style="color:#555;line-height:1.6">Your reading life starts now. Track every book you read, measure your reading speed, and build a habit that lasts.</p>
        <a href="${APP_URL}/library" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#18181b;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Open your library</a>
        <p style="margin-top:32px;font-size:13px;color:#999">You're receiving this because you signed up for ReadRise. Questions? Reply to this email.</p>
      </div>
    `,
  })
}

export interface WeeklySummaryData {
  booksInProgress: number
  pagesThisWeek: number
  currentStreak: number
}

export async function sendWeeklySummaryEmail(
  to: string,
  name: string,
  stats: WeeklySummaryData,
): Promise<void> {
  const { booksInProgress, pagesThisWeek, currentStreak } = stats
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your reading week — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:22px;margin-bottom:4px">Your reading week, ${name}</h1>
        <p style="color:#555;margin-bottom:24px">Here's how you did this week.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:12px;background:#f4f4f5;border-radius:8px;text-align:center;width:33%">
              <div style="font-size:28px;font-weight:700">${booksInProgress}</div>
              <div style="font-size:12px;color:#888;margin-top:4px">books in progress</div>
            </td>
            <td style="width:12px"></td>
            <td style="padding:12px;background:#f4f4f5;border-radius:8px;text-align:center;width:33%">
              <div style="font-size:28px;font-weight:700">${pagesThisWeek}</div>
              <div style="font-size:12px;color:#888;margin-top:4px">pages this week</div>
            </td>
            <td style="width:12px"></td>
            <td style="padding:12px;background:#f4f4f5;border-radius:8px;text-align:center;width:33%">
              <div style="font-size:28px;font-weight:700">${currentStreak}</div>
              <div style="font-size:12px;color:#888;margin-top:4px">day streak</div>
            </td>
          </tr>
        </table>
        <a href="${APP_URL}/dashboard" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#18181b;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">View your stats</a>
        <p style="margin-top:32px;font-size:13px;color:#999">You're receiving this weekly summary from ReadRise. <a href="${APP_URL}/settings" style="color:#999">Manage notifications</a></p>
      </div>
    `,
  })
}
