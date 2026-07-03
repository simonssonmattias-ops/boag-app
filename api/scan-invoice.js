export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { base64Data, mediaType, isPdf } = req.body
  if (!base64Data) return res.status(400).json({ error: 'Ingen bild/PDF skickad' })

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            isPdf
              ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } }
              : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
            { type: 'text', text: 'Detta är en leverantörsfaktura. Läs av och returnera ENDAST ett JSON-objekt utan markdown, i exakt detta format: {"leverantor": "företagsnamn", "fakturanummer": "fakturanr om det finns annars tom sträng", "datum": "YYYY-MM-DD fakturadatum", "belopp": beloppet exklusive moms som nummer utan text (om fakturan bara visar totalsumma inklusive moms, dra bort momsen), "beskrivning": "kort sammanfattning av vad fakturan avser"}' }
          ]
        }]
      })
    })

    const data = await anthropicRes.json()
    if (!anthropicRes.ok) {
      console.error('Anthropic API error:', data)
      return res.status(500).json({ error: data.error?.message || 'Anthropic API-fel' })
    }

    const raw = data.content?.find(c => c.type === 'text')?.text || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return res.status(200).json({ success: true, ...parsed })
  } catch (err) {
    console.error('scan-invoice error:', err)
    return res.status(500).json({ error: err.message })
  }
}
