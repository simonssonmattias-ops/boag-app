import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:boag@boag.se',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { subscriptions, title, body, tag, url } = req.body
  if (!subscriptions?.length) return res.status(400).json({ error: 'Inga prenumeranter' })

  const payload = JSON.stringify({ title, body, tag: tag || 'boag', url: url || '/' })
  const results = []

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload)
      results.push({ success: true })
    } catch (err) {
      results.push({ success: false, error: err.message, endpoint: sub.endpoint })
    }
  }

  const sent = results.filter(r => r.success).length
  return res.status(200).json({ success: true, sent, total: subscriptions.length })
}
