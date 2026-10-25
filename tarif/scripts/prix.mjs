#!/usr/bin/env node
// Skill « tarif » : Price Sensitivity Meter de van Westendorp (1976), calculé à partir des réponses des acheteurs simulés.
// Usage : node prix.mjs <etude.json> [lot-1.json lot-2.json …]
//   etude.json : { "produit", "devise": "€/mois", "prix": { "A": 9, "B": 19 }, "acheteurs": [ … ] (facultatif) }
//   lot-K.json : tableau d'acheteurs (ou { "acheteurs": [ … ] }), ajoutés à ceux d'etude.json.
//   Acheteur   : { id, profil, trop_bon_marche, bonne_affaire, cher, trop_cher, achete_A, achete_B, … }
// Sortie, à côté d'etude.json : reponses.json (réponses fusionnées), resultats.json, rapport.md (aussi affiché).
// Aucune dépendance : Node 18 ou plus suffit.
import fs from "node:fs";
import path from "node:path";

const QUESTIONS = ["trop_bon_marche", "bonne_affaire", "cher", "trop_cher"];
const POINTS_GRILLE = 4000;
const LARGEUR = 64;
const HAUTEUR = 17;
const MIN_FIABLE = 30;
const BRUIT = 1e-9; // écart dû aux arrondis des nombres à virgule (1 - 0,7 ≠ 0,3 exactement)

const lireJson = (fichier) => {
  try {
    return JSON.parse(fs.readFileSync(fichier, "utf8"));
  } catch (e) {
    throw new Error(`${fichier} : JSON illisible (${e.message})`);
  }
};
const estPrix = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;
const estReponse = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0; // 0 permis : « même gratuit, je n'en douterais pas »
const part = (liste, test) => (liste.length ? liste.filter(test).length / liste.length : 0);
const mediane = (valeurs) => {
  const v = [...valeurs].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
const quantile = (valeurs, q) => [...valeurs].sort((a, b) => a - b)[Math.min(valeurs.length - 1, Math.floor(q * valeurs.length))];
const pct = (x) => `${Math.round(x * 100)} %`;

function chargerEtude(fichiers) {
  const [fichierEtude, ...lots] = fichiers;
  const etude = lireJson(fichierEtude);
  const prix = etude.prix ?? {};
  if (!estPrix(prix.A)) throw new Error(`${fichierEtude} : "prix.A" doit être un nombre positif`);
  if (prix.B !== undefined && !estPrix(prix.B)) throw new Error(`${fichierEtude} : "prix.B" doit être un nombre positif`);
  const ajoutes = lots.flatMap((f) => {
    const d = lireJson(f);
    const liste = Array.isArray(d) ? d : d.acheteurs;
    if (!Array.isArray(liste)) throw new Error(`${f} : il faut un tableau d'acheteurs`);
    return liste;
  });
  return {
    produit: String(etude.produit ?? ""),
    devise: String(etude.devise ?? "€"),
    prix: Object.fromEntries(Object.entries({ A: prix.A, B: prix.B }).filter(([, v]) => v !== undefined)),
    acheteurs: [...(etude.acheteurs ?? []), ...ajoutes],
    dossier: path.dirname(fichierEtude),
  };
}

function probleme(a, codes, idsVus) {
  if (!a || typeof a !== "object") return "pas un objet";
  if (idsVus.has(a.id)) return "id en double";
  if (typeof a.profil !== "string" || !a.profil.trim()) return "profil manquant";
  const manquant = QUESTIONS.find((q) => !estReponse(a[q]));
  if (manquant) return `${manquant} n'est pas un prix (nombre, 0 ou plus)`;
  const ordonne = a.trop_bon_marche <= a.bonne_affaire && a.bonne_affaire <= a.cher && a.cher <= a.trop_cher;
  if (!ordonne) return "réponses incohérentes (il faut trop bon marché ≤ bonne affaire ≤ cher ≤ trop cher)";
  const sansAchat = codes.find((c) => typeof a[`achete_${c}`] !== "boolean");
  if (sansAchat) return `achete_${sansAchat} doit valoir true ou false`;
  return null;
}

function trier(acheteurs, codes) {
  const idsVus = new Set();
  return acheteurs.reduce(
    (acc, a) => {
      const raison = probleme(a, codes, idsVus);
      if (a && typeof a === "object") idsVus.add(a.id);
      return raison
        ? { ...acc, ecartes: [...acc.ecartes, { id: a?.id ?? null, raison }] }
        : { ...acc, valides: [...acc.valides, a] };
    },
    { valides: [], ecartes: [] },
  );
}

// Les quatre courbes cumulées classiques (part des acheteurs, de 0 à 1, pour un prix p).
function courbes(acheteurs) {
  const col = (q) => acheteurs.map((a) => a[q]);
  const [tb, ba, ch, tc] = QUESTIONS.map(col);
  return {
    tropBonMarche: (p) => part(tb, (v) => v >= p), // décroissante
    plusUneBonneAffaire: (p) => 1 - part(ba, (v) => v >= p), // « not cheap », croissante
    pasEncoreCher: (p) => 1 - part(ch, (v) => v <= p), // « not expensive », décroissante
    tropCher: (p) => part(tc, (v) => v <= p), // croissante
  };
}

// Prix où f et g se croisent. Une courbe monte, l'autre descend : leur écart change de signe une seule fois.
function croisement(f, g, grille) {
  const d = grille.map((p) => f(p) - g(p)).map((x) => (Math.abs(x) < BRUIT ? 0 : x));
  const depart = d.findIndex((x) => x !== 0);
  if (depart < 0) return null;
  const signe = Math.sign(d[depart]);
  const i = d.findIndex((x, k) => k > depart && Math.sign(x) !== signe);
  if (i < 0) return null;
  if (d[i] !== 0) return grille[i - 1] + ((grille[i] - grille[i - 1]) * d[i - 1]) / (d[i - 1] - d[i]);
  const fin = d.findIndex((x, k) => k > i && x !== 0);
  return (grille[i] + grille[fin < 0 ? d.length - 1 : fin - 1]) / 2;
}

function grilleDePrix(acheteurs) {
  const tout = acheteurs.flatMap((a) => QUESTIONS.map((q) => a[q]));
  const [bas, haut] = [Math.min(...tout), Math.max(...tout)];
  return Array.from({ length: POINTS_GRILLE + 1 }, (_, k) => bas + ((haut - bas) * k) / POINTS_GRILLE);
}

function pointsVanWestendorp(acheteurs) {
  const c = courbes(acheteurs);
  const grille = grilleDePrix(acheteurs);
  const moitie = () => 0.5;
  return {
    marginalBas: croisement(c.tropBonMarche, c.plusUneBonneAffaire, grille), // PMC
    optimal: croisement(c.tropBonMarche, c.tropCher, grille), // OPP
    indifference: croisement(c.plusUneBonneAffaire, c.pasEncoreCher, grille), // IDP
    marginalHaut: croisement(c.tropCher, c.pasEncoreCher, grille), // PME
    fuite: croisement(c.tropCher, moitie, grille), // la majorité trouve trop cher au-delà
  };
}

function statsPrix(groupe, code, prix) {
  return {
    achetent: part(groupe, (a) => a[`achete_${code}`]),
    tropCher: part(groupe, (a) => a.trop_cher <= prix),
    tropBonMarche: part(groupe, (a) => a.trop_bon_marche >= prix),
  };
}

function parProfil(acheteurs, prix) {
  const noms = [...new Set(acheteurs.map((a) => a.profil))];
  return noms.map((profil) => {
    const groupe = acheteurs.filter((a) => a.profil === profil);
    return {
      profil,
      n: groupe.length,
      medianes: Object.fromEntries(QUESTIONS.map((q) => [q, mediane(groupe.map((a) => a[q]))])),
      prix: Object.fromEntries(Object.entries(prix).map(([code, p]) => [code, statsPrix(groupe, code, p)])),
    };
  });
}

function profilPremium(profils) {
  return [...profils].sort(
    (x, y) => y.medianes.cher - x.medianes.cher || y.medianes.trop_cher - x.medianes.trop_cher,
  )[0];
}

function graphique(acheteurs, points, prix) {
  const c = courbes(acheteurs);
  const bas = Math.min(...acheteurs.map((a) => a.trop_bon_marche));
  const haut = Math.max(quantile(acheteurs.map((a) => a.trop_cher), 0.95), ...Object.values(prix)) * 1.05;
  const colonne = (p) => Math.round(((p - bas) / (haut - bas)) * (LARGEUR - 1));
  const traits = [
    ["t", c.tropBonMarche],
    ["b", c.plusUneBonneAffaire],
    ["c", c.pasEncoreCher],
    ["X", c.tropCher],
  ];
  const lignes = Array.from({ length: HAUTEUR }, () => Array(LARGEUR).fill(" "));
  for (let x = 0; x < LARGEUR; x++) {
    const p = bas + ((haut - bas) * x) / (LARGEUR - 1);
    for (const [car, f] of traits) {
      const y = HAUTEUR - 1 - Math.round(f(p) * (HAUTEUR - 1));
      lignes[y][x] = lignes[y][x] === " " || lignes[y][x] === car ? car : "#";
    }
  }
  const ligneDeReperes = (marques) => {
    const ligne = Array(LARGEUR).fill(" ");
    for (const [car, p] of marques) {
      if (p !== null) ligne[Math.max(0, Math.min(LARGEUR - 1, colonne(p)))] = car;
    }
    return `       ${ligne.join("")}`;
  };
  const etiquette = (y) => (y === 0 ? "100 %" : y === HAUTEUR - 1 ? "  0 %" : y === (HAUTEUR - 1) / 2 ? " 50 %" : "     ");
  return [
    ...lignes.map((l, y) => `${etiquette(y)} |${l.join("")}`),
    `      +${"-".repeat(LARGEUR)}`,
    ligneDeReperes([
      ["1", points.marginalBas],
      ["2", points.optimal],
      ["3", points.marginalHaut],
    ]),
    ligneDeReperes(Object.entries(prix)),
    { bas, haut },
  ];
}

function formatPrix(devise) {
  return (p) =>
    p === null
      ? "non trouvé (les courbes ne se croisent pas dans la plage des réponses)"
      : `${p.toLocaleString("fr-FR", { maximumFractionDigits: p < 100 ? 2 : 0 })} ${devise}`;
}

function position(p, points) {
  if (points.marginalBas !== null && p < points.marginalBas) return "sous la fourchette";
  if (points.marginalHaut !== null && p > points.marginalHaut) return "au-dessus de la fourchette";
  return "dans la fourchette";
}

function rapport(etude, tri, points, global, profils, premium) {
  const fp = formatPrix(etude.devise);
  const codes = Object.keys(etude.prix);
  const n = tri.valides.length;
  const lignesGraph = graphique(tri.valides, points, etude.prix);
  const { bas, haut } = lignesGraph.pop();
  const entete = `| Profil | n | ${codes.map((c) => `Achèteraient à ${fp(etude.prix[c])} (${c})`).join(" | ")} | ${codes.map((c) => `Trop cher à ${c}`).join(" | ")} |`;
  const ligneProfil = (p) =>
    `| ${p.profil} | ${p.n} | ${codes.map((c) => pct(p.prix[c].achetent)).join(" | ")} | ${codes.map((c) => pct(p.prix[c].tropCher)).join(" | ")} |`;
  const avertissements = [
    ...(tri.ecartes.length ? [`${tri.ecartes.length} réponse(s) écartée(s) : ${tri.ecartes.map((e) => `${e.id} (${e.raison})`).join(" ; ")}.`] : []),
    ...(n < MIN_FIABLE ? [`Seulement ${n} réponses valides : les courbes sont très sensibles à chaque réponse.`] : []),
  ];
  return [
    `# Ton prix face à ${n} acheteurs (simulation)`,
    "",
    `Produit : ${etude.produit || "(non précisé)"}`,
    `Réponses valides : ${n} / ${etude.acheteurs.length}`,
    ...avertissements.map((a) => `Attention : ${a}`),
    "",
    `## Fourchette de prix acceptable : ${fp(points.marginalBas)} à ${fp(points.marginalHaut)}`,
    "",
    `- Point de prix marginal bas (« trop bon marché » croise « plus une bonne affaire ») : ${fp(points.marginalBas)}`,
    `- Prix optimal (« trop bon marché » croise « trop cher ») : ${fp(points.optimal)}`,
    `- Prix d'indifférence (« plus une bonne affaire » croise « pas encore cher ») : ${fp(points.indifference)}`,
    `- Point de prix marginal haut (« trop cher » croise « pas encore cher ») : ${fp(points.marginalHaut)}`,
    `- Le prix qui fait fuir (au-delà, plus de la moitié trouve trop cher) : ${fp(points.fuite)}`,
    "",
    "## Tes prix côte à côte",
    "",
    "| Prix | Position | Achèteraient | Trouvent trop cher | Trouvent trop bon marché | Chiffre d'affaires simulé pour 100 acheteurs |",
    "|---|---|---|---|---|---|",
    ...codes.map((c) => {
      const s = global[c];
      return `| ${c} : ${fp(etude.prix[c])} | ${position(etude.prix[c], points)} | ${pct(s.achetent)} | ${pct(s.tropCher)} | ${pct(s.tropBonMarche)} | ${fp(Math.round(s.achetent * 100 * etude.prix[c]))} |`;
    }),
    "",
    "### Par profil",
    "",
    entete,
    `|---|---|${codes.map(() => "---|").join("")}${codes.map(() => "---|").join("")}`,
    ...profils.map(ligneProfil),
    "",
    "## Le profil prêt à payer davantage",
    "",
    `${premium.profil} (${premium.n} acheteurs) : « cher mais envisageable » à partir de ${fp(premium.medianes.cher)} en médiane, « trop cher » à ${fp(premium.medianes.trop_cher)} (tous profils : ${fp(mediane(tri.valides.map((a) => a.cher)))} et ${fp(mediane(tri.valides.map((a) => a.trop_cher)))}). Piste d'offre premium.`,
    "",
    "| Profil | n | Trop bon marché | Bonne affaire | Cher mais envisageable | Trop cher |",
    "|---|---|---|---|---|---|",
    ...profils.map((p) => `| ${p.profil} | ${p.n} | ${QUESTIONS.map((q) => fp(p.medianes[q])).join(" | ")} |`),
    "",
    "(médianes des réponses de chaque profil)",
    "",
    "## Les courbes",
    "",
    "```",
    ...lignesGraph,
    `       ${fp(bas)} … ${fp(haut)}`,
    "",
    "t trop bon marché   b plus une bonne affaire   c pas encore cher   X trop cher   # croisement",
    `1 marginal bas   2 optimal   3 marginal haut   ${codes.map((c) => `${c} ton prix ${c}`).join("   ")}`,
    "```",
    "",
    "Simulation : un point de départ, à confirmer avec de vrais clients ou un test de page de prix.",
  ].join("\n");
}

function main() {
  const fichiers = process.argv.slice(2);
  if (!fichiers.length) {
    console.error("usage : node prix.mjs <etude.json> [lot-1.json lot-2.json …]");
    process.exit(1);
  }
  const etude = chargerEtude(fichiers);
  const codes = Object.keys(etude.prix);
  const tri = trier(etude.acheteurs, codes);
  if (!tri.valides.length) throw new Error(`aucune réponse valide (${tri.ecartes.map((e) => e.raison).join(" ; ")})`);
  const points = pointsVanWestendorp(tri.valides);
  const global = Object.fromEntries(codes.map((c) => [c, statsPrix(tri.valides, c, etude.prix[c])]));
  const profils = parProfil(tri.valides, etude.prix);
  const premium = profilPremium(profils);
  const texte = rapport(etude, tri, points, global, profils, premium);
  const { dossier, ...sansDossier } = etude;
  fs.writeFileSync(path.join(dossier, "reponses.json"), JSON.stringify(sansDossier, null, 2));
  fs.writeFileSync(
    path.join(dossier, "resultats.json"),
    JSON.stringify({ n: tri.valides.length, ecartes: tri.ecartes, points, prix: etude.prix, global, profils, premium: premium.profil }, null, 2),
  );
  fs.writeFileSync(path.join(dossier, "rapport.md"), texte);
  console.log(texte);
}

try {
  main();
} catch (e) {
  console.error(`Erreur : ${e.message}`);
  process.exit(1);
}
