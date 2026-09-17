/* =====================================================================
   Relais Albert — Cloudflare Worker (proxy complet)

   INSTALLATION
   1. dash.cloudflare.com → Workers & Pages → votre worker → Edit code
   2. Remplacer tout le contenu par ce fichier → Deploy
   3. Settings → Variables and Secrets → Secret CLE_ALBERT = votre clé
   4. Ajuster ORIGINES si besoin (laisser 'null' pour fichier local)
   ===================================================================== */

const ALBERT_BASE = 'https://albert.api.etalab.gouv.fr';

const ORIGINES = [
  'https://christophejean13008.github.io',
  'null',   // fichier ouvert en file:// depuis le disque
  '',       // pas d'en-tête Origin
];

export default {
  async fetch(requete, env) {
    const origine = requete.headers.get('Origin') || '';
    const autorisee = ORIGINES.includes(origine);

    const corsCom = {
      'Access-Control-Allow-Origin'  : autorisee ? (origine || '*') : 'null',
      'Access-Control-Allow-Methods' : 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers' : 'Content-Type, Authorization',
    };

    // Répondre aux pré-vols CORS
    if (requete.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsCom });
    }

    // Extraire le chemin (/v1/models, /v1/chat/completions, …)
    const chemin = new URL(requete.url).pathname;
    const cible  = ALBERT_BASE + chemin;

    const entetes = {
      'Authorization': `Bearer ${env.CLE_ALBERT}`,
      'Content-Type' : 'application/json',
    };

    const reponseAlbert = await fetch(cible, {
      method  : requete.method,
      headers : entetes,
      body    : ['GET','HEAD'].includes(requete.method) ? null : requete.body,
    });

    const corps = await reponseAlbert.text();

    return new Response(corps, {
      status  : reponseAlbert.status,
      headers : {
        ...corsCom,
        'Content-Type': reponseAlbert.headers.get('Content-Type') || 'application/json',
      },
    });
  },
};
