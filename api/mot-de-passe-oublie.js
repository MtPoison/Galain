/* Fonction Vercel : « mot de passe oublié ».
   Génère un mot de passe TEMPORAIRE aléatoire, l'envoie par e-mail à l'administrateur, puis le met en place (haché) dans Supabase.
   Le mot de passe actuel n'est jamais lu ni stocké en clair.
   Variables d'environnement (Vercel → Settings → Environment Variables) :
     SUPABASE_URL, SUPABASE_SERVICE_KEY (clé secrète, JAMAIS dans le site), RESEND_API_KEY, ADMIN_EMAIL (plusieurs : séparées par des virgules)
   Protections : POST uniquement, requête issue du site lui-même (Origin), une demande toutes les 10 minutes (forgot_check),
   délais d'attente réseau, aucune information interne renvoyée au navigateur. */
const crypto = require('crypto');
const COOLDOWN_MSG = 'trop tôt';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';   // sans caractères ambigus (0/O, 1/l/I)
const motDePasse = () => Array.from({ length: 16 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');

/* durée maximale d'un appel externe : évite qu'une requête reste pendante */
const withTimeout = (url, opts) => fetch(url, Object.assign({ signal: AbortSignal.timeout(8000) }, opts));

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Méthode non autorisée' }); }

  /* seul le site lui-même peut appeler cette fonction (bloque les appels depuis un autre site ou un navigateur tiers) */
  let hoteOrigine = '';
  try { hoteOrigine = new URL(req.headers.origin).host; } catch (e) {}
  if (!hoteOrigine || hoteOrigine !== req.headers.host) return res.status(403).json({ error: 'Origine refusée' });

  const env = k => (process.env[k] || '').trim();                  // retire les espaces / retours à la ligne collés par erreur
  const SUPABASE_URL = env('SUPABASE_URL'), SUPABASE_SERVICE_KEY = env('SUPABASE_SERVICE_KEY'), RESEND_API_KEY = env('RESEND_API_KEY'), ADMIN_EMAIL = env('ADMIN_EMAIL');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY || !ADMIN_EMAIL) return res.status(500).json({ error: 'Service non configuré' });

  const headers = Object.assign({ apikey: SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' },
    SUPABASE_SERVICE_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY } : {});
  const rpc = (fn, body) => withTimeout(SUPABASE_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers, body: JSON.stringify(body || {}) });

  try {
    /* 1. limite : une seule demande toutes les 10 minutes (empêche d'inonder la boîte mail et de réinitialiser en boucle) */
    const limite = await rpc('forgot_check');
    if (!limite.ok) {
      const d = await limite.json().catch(() => ({}));
      if (String(d.message || '').includes(COOLDOWN_MSG)) return res.status(429).json({ error: 'Une demande a déjà été faite récemment. Réessayez dans quelques minutes.' });
      console.error('forgot_check', limite.status);
      return res.status(500).json({ error: 'Erreur du serveur.' });
    }

    const destinataires = ADMIN_EMAIL.split(/[,;\s]+/).map(a => a.replace(/["']/g, '').toLowerCase()).filter(a => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a));
    if (!destinataires.length) return res.status(500).json({ error: 'Service non configuré' });
    const nouveau = motDePasse();

    /* 2. e-mail d'abord : si l'envoi échoue, l'ancien mot de passe reste valable (pas de blocage) */
    const mail = await withTimeout('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Galian MCP <onboarding@resend.dev>',
        to: destinataires,
        subject: 'Galian MCP – mot de passe administrateur temporaire',
        text: 'Votre nouveau mot de passe administrateur temporaire : ' + nouveau + '\n\nConnectez-vous avec, puis changez-le via « Réinitialiser le mot de passe ».\nSi vous n\'êtes pas à l\'origine de cette demande, changez-le dès que possible.',
      }),
    });
    if (!mail.ok) {
      const d = await mail.json().catch(() => ({}));
      console.error('resend', mail.status, d.message || '');       // le détail reste dans les journaux Vercel, pas dans la réponse
      return res.status(502).json({ error: 'Envoi de l’e-mail impossible.' });
    }

    /* 3. mise en place du nouveau mot de passe (haché côté base, démarre aussi le délai de 10 minutes) */
    const maj = await rpc('forgot_reset', { p_new: nouveau });
    if (!maj.ok) { console.error('forgot_reset', maj.status); return res.status(500).json({ error: 'Erreur du serveur.' }); }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e.name);                                         // le détail pourrait contenir une clé : on ne l'affiche pas
    return res.status(500).json({ error: 'Erreur du serveur.' });
  }
};
