/* Fonction Vercel : « mot de passe oublié ».
   Envoie par e-mail le mot de passe administrateur actuel (lu dans Supabase avec la clé secrète).
   Variables d'environnement (Vercel → Settings → Environment Variables) :
     SUPABASE_URL, SUPABASE_SERVICE_KEY (clé secrète, JAMAIS dans le site), RESEND_API_KEY, ADMIN_EMAIL (plusieurs : séparées par des virgules) */
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const env = k => (process.env[k] || '').trim();                  // retire les espaces / retours à la ligne collés par erreur
  const SUPABASE_URL = env('SUPABASE_URL'), SUPABASE_SERVICE_KEY = env('SUPABASE_SERVICE_KEY'), RESEND_API_KEY = env('RESEND_API_KEY'), ADMIN_EMAIL = env('ADMIN_EMAIL');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY || !ADMIN_EMAIL) return res.status(500).json({ error: 'Service non configuré' });

  const headers = Object.assign({ apikey: SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' },
    SUPABASE_SERVICE_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY } : {});
  const rpc = fn => fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers, body: '{}' });

  try {
    /* 1. mot de passe actuel */
    const lu = await rpc('forgot_get');
    const mdp = lu.ok ? await lu.json() : null;
    if (!mdp) return res.status(409).json({ error: 'Mot de passe non disponible : changez-le une fois depuis le mode administrateur.' });

    /* 2. envoi par e-mail */
    const mail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Galian MCP <onboarding@resend.dev>',
        to: ADMIN_EMAIL.split(',').map(a => a.trim()).filter(Boolean),     // plusieurs adresses possibles, séparées par des virgules
        subject: 'Galian MCP – mot de passe administrateur',
        text: 'Votre mot de passe administrateur : ' + mdp,
      }),
    });
    if (!mail.ok) {
      const d = await mail.json().catch(() => ({}));                // raison donnée par Resend (ne contient pas de clé)
      return res.status(502).json({ error: 'Envoi de l’e-mail impossible' + (d.message ? ' : ' + d.message : '.') });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e.name);                                         // le détail pourrait contenir une clé : on ne l'affiche pas
    return res.status(500).json({ error: 'Erreur du serveur.' });
  }
};
