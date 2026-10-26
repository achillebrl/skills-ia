// Noyau du moteur « effets » : tout se calcule à partir du temps (window.seek(t)), aucune transition CSS ni minuterie,
// pour que chaque image du rendu soit identique d'un lancement à l'autre.
export const W = 1080, H = 1920;

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const inv = (a, b, v) => clamp((v - a) / (b - a));
export const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
export const easeIn = (k) => Math.pow(clamp(k), 3);
export const easeInOut = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const expoOut = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(k)));

/** Réponse d'un ressort amorti à un échelon (0 → 1), `tau` = temps depuis le départ, `f` = fréquence (Hz), `z` = amortissement. */
export function spring(tau, f = 2.2, z = 0.62) {
  if (tau <= 0) return 0;
  const w = 2 * Math.PI * f;
  if (z >= 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z * w / wd) * Math.sin(wd * tau));
}

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function el(tag, cls, html, parent) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  if (parent) parent.appendChild(n);
  return n;
}
export function css(n, props) { for (const k in props) n.style[k] = props[k]; }
export const show = (n, on) => { n.style.visibility = on ? "inherit" : "hidden"; };

/** Vidéo encodée tout-intra : un élément par usage, positionné image par image (attend « seeked »). */
export function video(src, parent, cls = "vid") {
  const v = el("video", cls, null, parent);
  v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = src;
  v.ready = new Promise((ok) => v.addEventListener("loadeddata", ok, { once: true }));
  return v;
}
export async function seekVideo(v, t) {
  await v.ready;
  const target = clamp(t, 0, Math.max(0, v.duration - 0.05));
  if (Math.abs(v.currentTime - target) < 1 / 120) return;
  await new Promise((ok) => { v.addEventListener("seeked", ok, { once: true }); v.currentTime = target; });
}
