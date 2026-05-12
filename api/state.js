export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { GIST_ID, GH_TOKEN, ADMIN_PASSWORD } = process.env;

  async function getState() {
    const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!r.ok) return {};
    const data = await r.json();
    const file = data.files?.['state.json'];
    return file ? JSON.parse(file.content) : {};
  }

  async function saveState(newState) {
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: { 'state.json': { content: JSON.stringify(newState, null, 2) } },
      }),
    });
  }

  if (req.method === 'GET') {
    try {
      return res.json(await getState());
    } catch {
      return res.json({});
    }
  }

  if (req.method === 'POST') {
    const { password, state, ping } = req.body || {};

    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (ping) return res.json({ ok: true });

    try {
      await saveState(state);
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ error: 'Failed to save state' });
    }
  }

  return res.status(405).end();
}
