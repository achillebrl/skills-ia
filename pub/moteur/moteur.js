// Moteur de la pub animée : une toile 1920 × 1080, une fonction pure seek(t) qui dessine l'image au temps t.
// Chaque marque est un dossier avec marque.js (couleurs, scènes) et, si elle a une voix, voix.mp3 + voix.json.
// Le rendu (scripts/rendu.mjs) appelle window.seek(t) image par image : pas d'horloge, pas d'aléatoire.
export const W = 1920;
export const H = 1080;

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const easeOut = (k) => 1 - (1 - k) ** 3;
export const easeInOut = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
export const easeBack = (k) => (k <= 0 ? 0 : 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2);
/** Entrée en rebond qui dure d secondes à partir de t0 (0 → 1, dépasse un peu 1). */
export const pop = (t, t0, d = 0.35) => easeBack(prog(t, t0, t0 + d));

export function fond(ctx, couleur) {
  ctx.fillStyle = couleur;
  ctx.fillRect(0, 0, W, H);
}

export function rect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Texte centré sur (x, y) qui entre en rebond (k = pop) ; align "left" | "center" | "right". */
export function texte(ctx, s, x, y, { taille = 90, poids = 800, couleur = "#111", align = "center", k = 1, police } = {}) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.globalAlpha = clamp(k * 2);
  ctx.font = `${poids} ${taille}px ${police ?? ctx.police ?? "sans-serif"}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = couleur;
  ctx.fillText(s, 0, 0);
  ctx.restore();
}

/** Mots qui apparaissent l'un après l'autre (temps de chaque mot dans `temps`), sur une ligne centrée. */
export function motsParMots(ctx, mots, temps, t, x, y, opts = {}) {
  ctx.save();
  ctx.font = `${opts.poids ?? 800} ${opts.taille ?? 90}px ${opts.police ?? ctx.police ?? "sans-serif"}`;
  const espace = ctx.measureText(" ").width;
  const largeurs = mots.map((m) => ctx.measureText(m).width);
  ctx.restore();
  let cx = x - (largeurs.reduce((a, b) => a + b, 0) + espace * (mots.length - 1)) / 2;
  mots.forEach((m, i) => {
    const k = pop(t, temps[i] ?? temps.at(-1), 0.3);
    const couleur = opts.couleurs?.[i] ?? opts.couleur;
    texte(ctx, m, cx + largeurs[i] / 2, y + (1 - clamp(k)) * 30, { ...opts, couleur, k: clamp(k * 1.2) });
    cx += largeurs[i] + espace;
  });
}

/** Trait qui se dessine le long d'une courbe (points [[x, y], …]) : k = part dessinée, k0 = part déjà effacée. */
export function trait(ctx, points, k, { couleur = "#e33", epaisseur = 16, k0 = 0 } = {}) {
  if (k <= k0) return;
  const pts = lisser(points);
  const long = [0];
  for (let i = 1; i < pts.length; i++) long.push(long[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = long.at(-1);
  ctx.save();
  ctx.strokeStyle = couleur;
  ctx.lineWidth = epaisseur;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  let debut = true;
  pts.forEach((p, i) => {
    const l = long[i] / total;
    if (l < k0 || l > k) return;
    if (debut) ctx.moveTo(p[0], p[1]);
    else ctx.lineTo(p[0], p[1]);
    debut = false;
  });
  ctx.stroke();
  ctx.restore();
}

/** Courbe de Catmull-Rom échantillonnée (passe par tous les points). */
function lisser(points, n = 24) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [points[i - 1] ?? points[i], points[i], points[i + 1], points[i + 2] ?? points[i + 1]];
    for (let s = 0; s < n; s++) {
      const u = s / n;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u * u
        + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u * u * u)));
    }
  }
  out.push(points.at(-1));
  return out;
}

/** Transition : un trait épais qui traverse l'écran autour de t0 (0,5 s), à poser par-dessus deux scènes. */
export function balayage(ctx, t, t0, couleur, sens = 1) {
  const k = prog(t, t0 - 0.25, t0 + 0.25);
  if (k <= 0 || k >= 1) return;
  const pts = sens > 0 ? [[-200, 900], [600, 300], [1300, 800], [2150, 150]] : [[2150, 900], [1300, 250], [600, 800], [-200, 150]];
  trait(ctx, pts, easeInOut(clamp(k * 1.6)), { couleur, epaisseur: 120, k0: easeInOut(clamp(k * 1.6 - 0.6)) });
}

/** Téléphone (cadre noir, écran arrondi) centré en x, posé à y, de hauteur h ; dessinEcran(ctx, w, h) remplit l'écran. */
export function telephone(ctx, x, y, h, k, dessinEcran, angle = 0) {
  if (k <= 0) return;
  const w = h * 0.49;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(k, k);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 30;
  rect(ctx, -w / 2, -h / 2, w, h, w * 0.16);
  ctx.fillStyle = "#111";
  ctx.fill();
  ctx.shadowColor = "transparent";
  const m = w * 0.04;
  rect(ctx, -w / 2 + m, -h / 2 + m, w - 2 * m, h - 2 * m, w * 0.13);
  ctx.save();
  ctx.clip();
  ctx.translate(-w / 2 + m, -h / 2 + m);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w - 2 * m, h - 2 * m);
  dessinEcran(ctx, w - 2 * m, h - 2 * m);
  ctx.restore();
  rect(ctx, -w * 0.14, -h / 2 + m * 1.6, w * 0.28, w * 0.07, w * 0.035);
  ctx.fillStyle = "#111";
  ctx.fill();
  ctx.restore();
}

/** Pastille arrondie (texte blanc sur couleur) centrée en (x, y). */
export function pastille(ctx, s, x, y, couleur, { taille = 48, k = 1, police } = {}) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.font = `700 ${taille}px ${police ?? ctx.police ?? "sans-serif"}`;
  const w = ctx.measureText(s).width + taille * 1.2;
  const h = taille * 1.7;
  rect(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.fillStyle = couleur;
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s, 0, 2);
  ctx.restore();
}

/** Emoji ou pictogramme dessiné en texte, centré, avec rebond. */
export function picto(ctx, s, x, y, taille, k = 1, angle = 0) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(k, k);
  ctx.font = `${taille}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s, 0, 0);
  ctx.restore();
}

/**
 * Temps des mots de la voix off (voix.json écrit par scripts/voix.mjs). mot("panier") renvoie le début du premier
 * mot qui commence par « panier », cherché après `apres` secondes ; repli `defaut` sans voix.
 */
export function horloge(voix) {
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9']/g, "");
  return (mot, apres = 0, defaut = apres) => {
    const m = voix?.mots?.find((w) => w.s >= apres - 0.01 && norm(w.w).startsWith(norm(mot)));
    return m ? m.s : defaut;
  };
}
