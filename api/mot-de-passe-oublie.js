/* Fonction Vercel : « mot de passe oublié ».
   Génère un nouveau mot de passe administrateur, l'enregistre (haché) dans Supabase et l'envoie par e-mail.
   Variables d'environnement (Vercel → Settings → Environment Variables) :
     SUPABASE_URL, SUPABASE_SERVICE_KEY (clé secrète, JAMAIS dans le site), RESEND_API_KEY, ADMIN_EMAIL */
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const env = k => (process.env[k] || '').trim();                  // retire les espaces / retours à la ligne collés par erreur
  const SUPABASE_URL = env('SUPABASE_URL'), SUPABASE_SERVICE_KEY = env('SUPABASE_SERVICE_KEY'), RESEND_API_KEY = env('RESEND_API_KEY'), ADMIN_EMAIL = env('ADMIN_EMAIL');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY || !ADMIN_EMAIL) return res.status(500).json({ error: 'Service non configuré' });

  const headers = Object.assign({ apikey: SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' },
    SUPABASE_SERVICE_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY } : {});
  const rpc = (fn, body) => fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers, body: JSON.stringify(body || {}) });

  try {
    /* 1. une seule demande toutes les 10 minutes */
    const check = await rpc('forgot_check');
    if (!check.ok) return res.status(429).json({ error: 'Une demande vient d’être faite. Réessayez dans 10 minutes.' });

    /* 2. le nouveau mot de passe est envoyé AVANT d'être appliqué : si l'e-mail échoue, l'ancien reste valable */
    const nouveau = crypto.randomBytes(9).toString('base64url');
    const mail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Galian MCP <onboarding@resend.dev>', to: [ADMIN_EMAIL], subject: 'Galian MCP – nouveau mot de passe administrateur',
        text: 'Votre nouveau mot de passe administrateur : ' + nouveau + '\n\nVous pourrez le changer depuis le mode administrateur (« Réinitialiser le mot de passe »).',
      }),
    });
    if (!mail.ok) return res.status(502).json({ error: 'Envoi de l’e-mail impossible.' });

    /* 3. application du nouveau mot de passe */
    const reset = await rpc('forgot_reset', { p_new: nouveau });
    if (!reset.ok) return res.status(500).json({ error: 'Impossible de modifier le mot de passe.' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e.name);                                         // le détail pourrait contenir une clé : on ne l'affiche pas
    return res.status(500).json({ error: 'Erreur du serveur.' });
  }
};
