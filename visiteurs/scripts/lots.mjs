#!/usr/bin/env node
// Prépare les briefs des sous-agents « visiteurs » : lots de 20 visiteurs au plus, du même appareil, avec seulement les images
// et la liste des éléments de cet appareil (moins d'images et de fichiers à lire = moins cher).
// Usage :
//   node lots.mjs <dossier>                              -> lot-K-brief.md pour tous les visiteurs de personas.json
//   node lots.mjs <dossier> --variante <K> --ids 1,4,9   -> variante-K-brief.md (test du titre, étapes 1-2 seulement)
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dir = path.resolve(args[0] ?? "");
const opt = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
if (!args[0] || !fs.existsSync(path.join(dir, "config.json"))) {
  console.error("usage : node lots.mjs <dossier> [--variante K --ids 1,2,3]  (config.json et personas.json requis)");
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(path.join(dir, "config.json"), "utf8"));
const personas = JSON.parse(fs.readFileSync(path.join(dir, "personas.json"), "utf8"));
const capture = JSON.parse(fs.readFileSync(path.join(dir, "page-capture.json"), "utf8"));
const LOT_SIZE = 20;
const devOf = (p) => (/mobile/i.test(p.appareil) ? "mobile" : "desktop");

function elementList(dev) {
  return capture.profiles[dev].elements
    .map((e) => `- ${e.id} « ${e.text} » (écran ${e.ecran ?? "?"}${e.inFold ? ", visible sans défiler" : ""})`)
    .join("\n");
}

function header() {
  return `Tu joues des visiteurs d'une page web, **un par un et indépendamment**, à partir de vraies captures de la page.
Page : ${config.url}
Ce que la page propose vraiment (pour juger s'ils ont compris, pas à leur révéler) : ${config.offre}
But de la page : ${config.but}
`;
}

const RULES = `Méthode : lis toutes les images d'un coup (plusieurs lectures dans un même message), puis écris le fichier en une seule fois.
Règles : sois honnête et spécifique, pas complaisant ; un hors-cible part souvent vite ; un pressé sur mobile ne voit que le haut ; ne cite que des éléments présents dans les captures ; les réponses doivent différer comme différeraient de vraies personnes. Pas de commentaire, pas de résumé : écris le fichier puis réponds seulement « ok ».`;

function visitBrief(k, dev, list) {
  const p = capture.profiles[dev];
  const screens = p.screenshots.screens.map((f) => path.join(dir, f)).join("\n");
  return `${header()}
Appareil de tous ces visiteurs : **${dev === "mobile" ? "mobile" : "ordinateur"}**.
Haut de page (ce qu'on voit sans défiler, 5 secondes) : ${path.join(dir, p.screenshots.fold)}
Puis la page écran par écran, éléments cliquables entourés et numérotés :
${screens}

Éléments cliquables :
${elementList(dev)}

Visiteurs :
${JSON.stringify(list)}

Pour chaque visiteur, dans cet ordre, sans regarder plus loin que ce qu'il verrait :
1. **5 secondes.** Seulement l'image du haut de page. Un pressé lit le titre et le bouton, rarement le paragraphe. \`premier_regard\` = l'identifiant de l'élément cliquable qui attire son œil en premier (ou null si c'est le titre ou une image).
2. **Compréhension.** \`compris_5s\` = ce qu'il croit que fait le site, avec SES mots, en une phrase. \`juste\` = true seulement si ça correspond vraiment à l'offre. \`reste\` = true s'il continuerait vu sa patience, son intérêt et sa première impression.
3. **Tâche** (s'il reste ; sinon \`clic\` = null). Il veut : ${config.but}. Il parcourt les écrans dans l'ordre et s'arrête selon sa patience : pressé, écrans 1-2 ; normal, jusqu'à 4 ; curieux, tous. \`bouton_cherche\` = ce qu'il cherche à cliquer ; \`clic\` = l'identifiant qu'il cliquerait vraiment, ou null s'il abandonne ; \`ecran_clic\` = le numéro de l'écran ; \`perdu\` = où et pourquoi il hésite ou bloque, ou null.
4. **Décision.** \`decision\` = "oui" | "peut-être" | "non" (passerait-il à l'action aujourd'hui ?) ; \`objection\` = ce qui le retient, en une phrase ; \`manque\` = l'information qui lui manque, ou null ; \`citation\` = une phrase qu'il dirait à voix haute, dans son registre.

${RULES}
Écris le tableau JSON des ${list.length} réponses (\`{ "id", "premier_regard", "compris_5s", "juste", "reste", "bouton_cherche", "clic", "ecran_clic", "perdu", "decision", "objection", "manque", "citation" }\`) dans ${path.join(dir, `lot-${k}.json`)}.
`;
}

function variantBrief(k, list) {
  const cap = JSON.parse(fs.readFileSync(path.join(dir, `variante-${k}-capture.json`), "utf8"));
  return `${header()}
Titre testé : « ${cap.variant?.h1 ?? ""} »${cap.variant?.sub ? ` / sous-titre : « ${cap.variant.sub} »` : ""}
Haut de page avec ce titre : mobile ${path.join(dir, cap.profiles.mobile.screenshots.fold)} · ordinateur ${path.join(dir, cap.profiles.desktop.screenshots.fold)}
Chaque visiteur regarde seulement l'image de son appareil.

Visiteurs :
${JSON.stringify(list)}

Pour chaque visiteur : 1. **5 secondes** sur le haut de page de son appareil. 2. \`compris_5s\` = ce qu'il croit que fait le site, avec SES mots ; \`juste\` = true seulement si ça correspond vraiment à l'offre ; \`reste\` = true s'il continuerait.

${RULES}
Écris le tableau JSON (\`{ "id", "compris_5s", "juste", "reste" }\`) dans ${path.join(dir, `variante-${k}-reponses.json`)}.
`;
}

if (opt("variante")) {
  const k = opt("variante");
  const ids = new Set(String(opt("ids") ?? "").split(",").map((x) => x.trim()).filter(Boolean));
  const list = personas.filter((p) => ids.has(String(p.id)));
  const file = path.join(dir, `variante-${k}-brief.md`);
  fs.writeFileSync(file, variantBrief(k, list));
  console.log(`${file} (${list.length} visiteurs)`);
} else {
  let k = 0;
  for (const dev of ["mobile", "desktop"]) {
    const group = personas.filter((p) => devOf(p) === dev);
    const nLots = Math.ceil(group.length / LOT_SIZE);
    for (let i = 0; i < nLots; i += 1) {
      const list = group.filter((_, j) => j % nLots === i);
      k += 1;
      const file = path.join(dir, `lot-${k}-brief.md`);
      fs.writeFileSync(file, visitBrief(k, dev, list));
      console.log(`${file} (${list.length} visiteurs, ${dev})`);
    }
  }
}
