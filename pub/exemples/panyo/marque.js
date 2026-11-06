// Exemple : pub de 19 s pour « Panyo », une appli de courses FICTIVE (marque inventée pour la démo).
// Une scène par phrase de la voix off ; chaque apparition est calée sur un mot avec mot("…").
import { W, H, prog, pop, easeOut, fond, rect, texte, trait, balayage, telephone, pastille, picto } from "../../moteur/moteur.js";

const ORANGE = "#F2542D";
const ENCRE = "#1B1B1F";
const BLANC = "#FFFFFF";
const GRIS = "#F3F1EE";
const DECALAGE = 0.3; // la voix démarre à 0,3 s dans pub.mp4 (scripts/rendu.mjs)

/** Écran de l'appli (fictive) dans le téléphone : en-tête, recherche, grille de produits. */
function ecranAppli(ctx, w, h, t, t0, produits = ["🍅", "🥖", "🥑", "🧀", "🍌", "🥛"]) {
  ctx.fillStyle = ORANGE;
  ctx.fillRect(0, 0, w, h * 0.2);
  texte(ctx, "panyo", w / 2, h * 0.1, { taille: w * 0.13, couleur: BLANC });
  rect(ctx, w * 0.07, h * 0.23, w * 0.86, h * 0.065, h * 0.03);
  ctx.fillStyle = GRIS;
  ctx.fill();
  texte(ctx, "Rechercher un produit", w * 0.15, h * 0.263, { taille: w * 0.05, poids: 500, couleur: "#9A9A9A", align: "left" });
  produits.forEach((p, i) => {
    const k = pop(t, t0 + 0.15 + i * 0.07);
    const x = w * (0.28 + (i % 2) * 0.44);
    const y = h * (0.42 + Math.floor(i / 2) * 0.19);
    if (k <= 0) return;
    rect(ctx, x - w * 0.19, y - h * 0.08, w * 0.38, h * 0.16, w * 0.06);
    ctx.fillStyle = GRIS;
    ctx.fill();
    picto(ctx, p, x, y - h * 0.015, w * 0.13, k);
    rect(ctx, x - w * 0.11, y + h * 0.045, w * 0.22, h * 0.018, h * 0.009);
    ctx.fillStyle = "#DCD8D2";
    ctx.fill();
  });
}

/** Petite étiquette permanente : la marque est fictive. */
function fictive(ctx, surOrange) {
  ctx.save();
  ctx.globalAlpha = 0.85;
  texte(ctx, "Marque fictive · exemple", 70, 60, { taille: 26, poids: 600, couleur: surOrange ? BLANC : "#8A8A8A", align: "left" });
  ctx.restore();
}

export default function ({ mot }) {
  const m = (s, apres = 0, defaut = apres) => mot(s, apres, defaut) + DECALAGE;
  const T = {
    frigo: m("frigo", 0, 0.8), ouvre: m("ouvre", 1, 1.7), panyo: m("panyo", 1.5, 2.1), courses: m("courses", 2.5, 3),
    repas: m("repas", 3, 3.6), pharmacie: m("pharmacie", 3.5, 4.2), tout: m("tout", 5, 5.4), seule: m("seule", 5, 6),
    produits: m("les", 6.5, 7), marche: m("marche", 7, 7.7), prix: m("des", 8, 8.6), bas: m("bas", 9, 9.2),
    ajoute: m("ajoute", 9.5, 9.9), secondes: m("secondes", 11, 11.3), livre: m("livre", 12, 12.2), minutes: m("minutes", 12.5, 13),
    fin: m("panyo", 13.5, 14), tes: m("tes", 14.5, 15), telecharge: m("telecharge", 16, 16.5), appli: m("l'appli", 16.8, 17.1),
  };
  const duree = T.telecharge + 2.5;

  const scenes = [
    // « Plus rien dans le frigo ? »
    [0, T.ouvre, (ctx, t) => {
      fond(ctx, BLANC);
      trait(ctx, [[260, 820], [620, 300], [1100, 760], [1640, 260]], easeOut(prog(t, 0, 0.7)), { couleur: ORANGE, epaisseur: 18, k0: easeOut(prog(t, 0.5, 1.1)) });
      ["🍅", "🥖", "🍌", "🥑", "🧀", "🥛", "🍗", "🥕"].forEach((p, i) => {
        const a = (i / 8) * Math.PI * 2 + t * 0.35;
        picto(ctx, p, W / 2 + Math.cos(a) * 560, H / 2 + Math.sin(a) * 330, 96, pop(t, 0.15 + i * 0.06), Math.sin(t * 2 + i) * 0.15);
      });
      texte(ctx, "plus rien dans le", W / 2, 455, { taille: 64, poids: 600, couleur: ENCRE, k: pop(t, 0.3) });
      texte(ctx, "frigo ?", W / 2, 575, { taille: 170, couleur: ORANGE, k: pop(t, T.frigo - 0.1) });
      trait(ctx, [[700, 680], [960, 700], [1230, 672]], easeOut(prog(t, T.frigo + 0.2, T.frigo + 0.6)), { couleur: ORANGE, epaisseur: 14 });
    }, false],
    // « Ouvre Panyo ! »
    [T.ouvre, T.courses, (ctx, t) => {
      fond(ctx, ORANGE);
      texte(ctx, "ouvre", 600, 400, { taille: 70, poids: 600, couleur: BLANC, k: pop(t, T.ouvre) });
      texte(ctx, "panyo", 600, 540, { taille: 230, couleur: BLANC, k: pop(t, T.panyo - 0.1) });
      const k = easeOut(prog(t, T.panyo - 0.2, T.panyo + 0.4));
      telephone(ctx, 1400 + (1 - k) * 700, 560, 820, 1, (c, w, h) => ecranAppli(c, w, h, t, T.panyo), -0.08 + (1 - k) * 0.3);
    }, true],
    // « Courses, repas, pharmacie : »
    [T.courses, T.tout, (ctx, t) => {
      fond(ctx, BLANC);
      [["🛒 Courses", T.courses, 430], ["🍲 Repas", T.repas, 930], ["💊 Pharmacie", T.pharmacie, 1470]].forEach(([s, t0, x]) =>
        pastille(ctx, s, x, 540, ORANGE, { taille: 58, k: pop(t, t0 - 0.1) }));
      trait(ctx, [[180, 540], [500, 330], [1000, 300], [1500, 330], [1760, 540], [1500, 760], [960, 790], [420, 760], [190, 560]],
        easeOut(prog(t, T.courses, T.tout - 0.2)), { couleur: ORANGE, epaisseur: 10 });
    }, false],
    // « tout dans une seule appli. »
    [T.tout, T.produits, (ctx, t) => {
      fond(ctx, BLANC);
      texte(ctx, "tout dans", 640, 450, { taille: 110, couleur: ENCRE, k: pop(t, T.tout) });
      texte(ctx, "une seule appli", 640, 590, { taille: 110, couleur: ORANGE, k: pop(t, T.seule - 0.1) });
      trait(ctx, [[230, 680], [640, 700], [1050, 672]], easeOut(prog(t, T.seule + 0.2, T.seule + 0.6)), { couleur: ORANGE, epaisseur: 14 });
      telephone(ctx, 1480, 540, 860, pop(t, T.tout + 0.1), (c, w, h) => ecranAppli(c, w, h, t, T.tout), 0.06);
    }, false],
    // « Les produits du marché. »
    [T.produits, T.prix, (ctx, t) => {
      fond(ctx, ORANGE);
      texte(ctx, "Les produits", 600, 470, { taille: 110, couleur: BLANC, k: pop(t, T.produits) });
      texte(ctx, "du marché", 600, 600, { taille: 110, couleur: ENCRE, k: pop(t, T.marche - 0.1) });
      telephone(ctx, 1420, 540, 860, pop(t, T.produits + 0.1), (c, w, h) => ecranAppli(c, w, h, t, T.produits, ["🍍", "🥭", "🍋", "🥬", "🌶️", "🍆"]), -0.06);
    }, true],
    // « Des prix plus bas. »
    [T.prix, T.ajoute, (ctx, t) => {
      fond(ctx, ORANGE);
      texte(ctx, "des prix", W / 2, 300, { taille: 90, poids: 600, couleur: BLANC, k: pop(t, T.prix) });
      const k = pop(t, T.prix + 0.2);
      texte(ctx, "2,49 €", W / 2 - 330, 560, { taille: 120, poids: 600, couleur: "rgba(255,255,255,0.7)", k });
      trait(ctx, [[W / 2 - 520, 600], [W / 2 - 140, 520]], easeOut(prog(t, T.bas - 0.2, T.bas + 0.1)), { couleur: ENCRE, epaisseur: 12 });
      texte(ctx, "1,89 €", W / 2 + 300, 560, { taille: 200, couleur: BLANC, k: pop(t, T.bas) });
      texte(ctx, "plus bas", W / 2, 780, { taille: 90, couleur: ENCRE, k: pop(t, T.bas + 0.1) });
      texte(ctx, "prix d'exemple", W / 2, 960, { taille: 28, poids: 500, couleur: BLANC, k: pop(t, T.bas + 0.2) });
    }, true],
    // « Ajouté au panier en quelques secondes, »
    [T.ajoute, T.livre, (ctx, t) => {
      fond(ctx, BLANC);
      pastille(ctx, "✓  Ajouté au panier", W / 2, 420, ORANGE, { taille: 64, k: pop(t, T.ajoute - 0.1) });
      const kb = pop(t, T.ajoute + 0.4);
      if (kb > 0) {
        ctx.beginPath();
        ctx.arc(W / 2 + 400, 360, 38 * kb, 0, Math.PI * 2);
        ctx.fillStyle = ENCRE;
        ctx.fill();
        texte(ctx, "1", W / 2 + 400, 362, { taille: 44, couleur: BLANC, k: kb });
      }
      texte(ctx, "en quelques secondes", W / 2, 640, { taille: 110, couleur: ENCRE, k: pop(t, T.secondes - 0.5) });
      trait(ctx, [[1060, 575], [1600, 565], [1625, 705], [1080, 718], [1045, 600], [1120, 562]], easeOut(prog(t, T.secondes, T.secondes + 0.5)), { couleur: ORANGE, epaisseur: 10 });
    }, false],
    // « livré en quelques minutes. »
    [T.livre, T.fin, (ctx, t) => {
      fond(ctx, GRIS);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) {
        rect(ctx, 220 + i * 170, 380 + j * 170, 120, 120, 24);
        ctx.fillStyle = "#E7E3DD";
        ctx.fill();
      }
      texte(ctx, "Livré en quelques", 1290, 220, { taille: 90, couleur: ENCRE, align: "right", k: pop(t, T.livre) });
      texte(ctx, "minutes.", 1320, 220, { taille: 90, couleur: ORANGE, align: "left", k: pop(t, T.minutes - 0.1) });
      const marches = [[280, 960], [700, 960], [700, 780], [1050, 780], [1050, 600], [1400, 600], [1400, 420], [1700, 420]];
      const k = easeOut(prog(t, T.livre, T.fin - 0.2));
      const n = marches.length - 1;
      ctx.save();
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(...marches[0]);
      const pos = k * n;
      for (let i = 1; i <= Math.ceil(pos); i++) {
        const f = Math.min(1, pos - (i - 1));
        ctx.lineTo(marches[i - 1][0] + (marches[i][0] - marches[i - 1][0]) * f, marches[i - 1][1] + (marches[i][1] - marches[i - 1][1]) * f);
      }
      ctx.stroke();
      ctx.restore();
      const i = Math.min(n - 1, Math.floor(pos));
      const f = pos - i;
      picto(ctx, "🛵", marches[i][0] + (marches[i + 1][0] - marches[i][0]) * f, marches[i][1] + (marches[i + 1][1] - marches[i][1]) * f - 60, 110, pop(t, T.livre));
    }, false],
    // « Panyo. Tes produits préférés. »
    [T.fin, T.telecharge, (ctx, t) => {
      fond(ctx, ORANGE);
      const k = pop(t, T.fin - 0.1);
      if (k > 0) {
        ctx.save();
        ctx.translate(W / 2, 400);
        ctx.scale(k, k);
        rect(ctx, -110, -110, 220, 220, 56);
        ctx.fillStyle = BLANC;
        ctx.fill();
        ctx.restore();
        picto(ctx, "🧺", W / 2, 405, 130, k);
      }
      texte(ctx, "panyo", W / 2, 640, { taille: 150, couleur: BLANC, k: pop(t, T.fin) });
      texte(ctx, "Tes produits préférés", W / 2, 800, { taille: 70, poids: 600, couleur: ENCRE, k: pop(t, T.tes - 0.1) });
      trait(ctx, [[150, 1010], [700, 900], [1300, 985], [1900, 860]], easeOut(prog(t, T.tes, T.tes + 0.8)), { couleur: BLANC, epaisseur: 10 });
    }, true],
    // « Télécharge l'appli ! »
    [T.telecharge, duree, (ctx, t) => {
      fond(ctx, BLANC);
      const k = pop(t, T.telecharge - 0.1);
      if (k > 0) {
        ctx.save();
        ctx.translate(560, 540);
        ctx.scale(k, k);
        rect(ctx, -150, -150, 300, 300, 76);
        ctx.fillStyle = ORANGE;
        ctx.fill();
        ctx.restore();
        picto(ctx, "🧺", 560, 545, 170, k);
      }
      texte(ctx, "PANYO", 760, 400, { taille: 54, couleur: ENCRE, align: "left", k: pop(t, T.telecharge) });
      texte(ctx, "Télécharge", 760, 520, { taille: 120, couleur: ENCRE, align: "left", k: pop(t, T.telecharge) });
      texte(ctx, "l'appli", 760, 650, { taille: 120, couleur: ORANGE, align: "left", k: pop(t, T.appli - 0.1) });
      ["iPhone", "Android"].forEach((s, i) => {
        const kb = pop(t, T.appli + 0.2 + i * 0.12);
        if (kb <= 0) return;
        ctx.save();
        ctx.translate(900 + i * 300, 790);
        ctx.scale(kb, kb);
        rect(ctx, -130, -42, 260, 84, 18);
        ctx.fillStyle = ENCRE;
        ctx.fill();
        ctx.restore();
        texte(ctx, s, 900 + i * 300, 792, { taille: 38, poids: 700, couleur: BLANC, k: kb });
      });
    }, false],
  ];

  return {
    duree,
    dessin(ctx, t) {
      const i = Math.max(0, scenes.findIndex(([a, b]) => t >= a && t < b) === -1 ? scenes.length - 1 : scenes.findIndex(([a, b]) => t >= a && t < b));
      const [, , dessiner, surOrange] = scenes[i];
      dessiner(ctx, t);
      fictive(ctx, surOrange);
      scenes.slice(1).forEach(([a], j) => balayage(ctx, t, a, scenes[j + 1][3] ? BLANC : ORANGE, j % 2 ? -1 : 1));
    },
  };
}
