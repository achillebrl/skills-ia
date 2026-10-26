// Les 6 effets plein écran (1080 × 1920). Chacun : effet(C)(host) → async update(t), t = secondes depuis le début du clip.
// C = config.json écrit par scripts/effet.py : fond (vidéo), detoure (vidéo détourée, WebM transparent), avant, images, textes.
import { H, W, clamp, css, easeInOut, easeOut, el, inv, lerp, seekVideo, spring, video } from "./core.js";

const HALF = 0.5;

// ---------- /carrousel-3d : tes images sur un grand anneau 3D qui tourne au-dessus de ta vidéo ----------
const carrousel = (C) => (host) => {
  const v = C.fond ? video(C.fond, host) : el("div", "rbg", null, host);
  const glow = el("div", "ringglow", null, host);
  const stagep = el("div", "ringstage", null, host);
  const ring = el("div", "ring", null, stagep);
  const N = 8, R = 640;
  const cards = Array.from({ length: N }, (_, i) => el("div", "rcard", `<img src="${C.images[i % C.images.length]}">`, ring));
  return async (t) => {
    if (C.fond) await seekVideo(v, t);
    const kin = spring(t - 0.05, 1.6, 0.75);
    // Deux coups de pouce : l'anneau part vite, ralentit, repart (le flou vient des sous-images du rendu).
    const rot = 18 * t + 150 * spring(t - 0.25, 0.85, 0.8) + 135 * spring(t - 1.2, 0.85, 0.8);
    css(ring, { transform: `translateZ(-700px) rotateX(-4deg) rotateY(${-rot}deg) scale(${lerp(0.6, 1, clamp(kin, 0, 1.06))})` });
    cards.forEach((c, i) => {
      const a = (i / N) * 360;
      const face = Math.cos(((a - rot) * Math.PI) / 180);
      css(c, { transform: `rotateY(${a}deg) translateZ(${R}px)`, filter: `brightness(${lerp(0.3, 1.05, clamp((face + 0.2) / 1.2))})` });
    });
    css(glow, { opacity: clamp(kin) * 0.8 });
    css(stagep, { opacity: clamp(kin * 2.5) });
  };
};

/** Silhouette blanche épaissie de `r` pixels (demi-résolution), tirée de la vidéo détourée. */
export function makeOutline() {
  const w = W * HALF, h = H * HALF;
  const src = document.createElement("canvas"); src.width = w; src.height = h;
  const dil = document.createElement("canvas"); dil.width = w; dil.height = h;
  const sctx = src.getContext("2d"), dctx = dil.getContext("2d");
  return function draw(vid, r, inner = 0) {
    sctx.globalCompositeOperation = "source-over";
    sctx.clearRect(0, 0, w, h); sctx.drawImage(vid, 0, 0, w, h);
    sctx.globalCompositeOperation = "source-in"; sctx.fillStyle = "#fff"; sctx.fillRect(0, 0, w, h);
    dctx.globalCompositeOperation = "source-over"; dctx.clearRect(0, 0, w, h);
    for (let a = 0; a < 16; a += 1) dctx.drawImage(src, Math.cos((a / 16) * 2 * Math.PI) * r, Math.sin((a / 16) * 2 * Math.PI) * r);
    if (inner > 0) {
      dctx.globalCompositeOperation = "destination-out";
      for (let a = 0; a < 16; a += 1) dctx.drawImage(src, Math.cos((a / 16) * 2 * Math.PI) * inner, Math.sin((a / 16) * 2 * Math.PI) * inner);
      dctx.drawImage(src, 0, 0);
    }
    return dil;
  };
}

/** Haut de la tête et son centre horizontal, lus dans la vidéo détourée (pour poser la couronne au bon endroit). */
function headOf(vid) {
  const w = 270, h = 480;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(vid, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const opaque = (x, y) => d[(y * w + x) * 4 + 3] > 128;
  for (let y = 0; y < h; y += 1) {
    let n = 0;
    for (let x = 0; x < w; x += 1) if (opaque(x, y)) n += 1;
    if (n < 4) continue;
    let sx = 0, sn = 0;
    for (let yy = y; yy < Math.min(h, y + 30); yy += 1) for (let x = 0; x < w; x += 1) if (opaque(x, yy)) { sx += x; sn += 1; }
    return { x: (sx / sn) * (W / w), top: y * (H / h) };
  }
  return { x: W / 2, top: 340 };
}

/** Filtre SVG « dessiné à la main » : la graine du bruit change 12 fois par seconde. */
function boilFilter(host, id, scale) {
  const svg = el("div", null, `<svg width="0" height="0" style="position:absolute"><filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="1"/><feDisplacementMap in="SourceGraphic" scale="${scale}"/></filter></svg>`, host);
  const turb = svg.querySelector("feTurbulence");
  return (t) => turb.setAttribute("seed", String(1 + (Math.floor(t * 12) % 5)));
}

// Dessins autour de la tête (déplacés selon la position de ta tête), puis flèche et gribouillis près du texte (fixes).
const HEAD_DOODLES = [
  { d: "M410 330 L440 230 L500 300 L540 210 L580 300 L640 230 L670 330 Z", t: 0.25 },
  { d: "M220 470 L220 560 M175 515 L265 515 M190 485 L250 545 M250 485 L190 545", t: 0.45 },
  { d: "M880 420 Q890 470 940 480 Q890 490 880 540 Q870 490 820 480 Q870 470 880 420 Z", t: 0.55 },
  { d: "M860 700 C860 660 910 650 925 690 C940 650 990 660 990 700 C990 745 925 780 925 800 C925 780 860 745 860 700 Z", t: 0.7 },
];
const TEXT_DOODLES = [
  { d: "M300 1150 C260 1010 300 900 400 820 M400 820 L330 830 M400 820 L385 890", t: 0.9 },
  { d: "M120 1330 C220 1300 320 1360 420 1320 C520 1290 620 1350 720 1315", t: 1.15 },
];
const CROWN_BASE = { x: 540, y: 330 };

// ---------- /doodle : contour blanc qui tremble autour de toi + dessins à main levée ----------
const doodle = (C) => (host) => {
  const bg = video(C.fond, host);
  const fg = video(C.detoure, host, "vid hidden");
  const ring = el("canvas", "dring", null, host); ring.width = W * HALF; ring.height = H * HALF;
  const rctx = ring.getContext("2d");
  const outline = makeOutline();
  const paths = (list) => list.map((p) => `<path pathLength="1" d="${p.d}"/>`).join("");
  const svgWrap = el("div", "doodles", `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <g filter="url(#boilA)" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
    <g class="dhead">${paths(HEAD_DOODLES)}</g>${paths(TEXT_DOODLES)}</g></svg>`, host);
  const all = [...HEAD_DOODLES, ...TEXT_DOODLES];
  const pathEls = [...svgWrap.querySelectorAll("path")];
  const headGroup = svgWrap.querySelector(".dhead");
  const txt = el("div", "dtext", C.texte, host);
  const boil = boilFilter(host, "boilA", 9);
  css(ring, { filter: "url(#boilA)" });
  let placed = false;
  return async (t) => {
    await Promise.all([seekVideo(bg, t), seekVideo(fg, t)]);
    if (!placed) {
      const head = headOf(fg);
      const dx = head.x - CROWN_BASE.x, dy = Math.max(40 - 210, head.top - 15 - CROWN_BASE.y);
      headGroup.setAttribute("transform", `translate(${dx.toFixed(0)} ${dy.toFixed(0)})`);
      placed = true;
    }
    boil(t);
    rctx.clearRect(0, 0, ring.width, ring.height); rctx.drawImage(outline(fg, 11, 6), 0, 0);
    css(ring, { opacity: clamp((t - 0.08) * 6) });
    pathEls.forEach((p, i) => { const k = easeOut(inv(all[i].t, all[i].t + 0.28, t)); p.style.strokeDasharray = "1"; p.style.strokeDashoffset = String(1 - k); });
    const kt = spring(t - 0.95, 3, 0.65);
    css(txt, { opacity: clamp(kt * 2), transform: `rotate(-7deg) scale(${lerp(0.6, 1, clamp(kt, 0, 1.1))})` });
  };
};

// ---------- /papier-decoupe : toi en autocollant sur un collage de papiers, lettres découpées façon lettre anonyme ----------
const papier = (C) => (host) => {
  el("div", "pp-base", `<div class="pp-grid"></div><div class="pp-y"></div><div class="pp-b"></div><div class="pp-p"></div>
    <div class="pp-news">${Array.from({ length: 9 }, () => "<i></i>").join("")}</div><div class="pp-tape t1"></div><div class="pp-tape t2"></div>`, host);
  const chars = [...C.texte.toUpperCase()];
  const KINDS = ["a", "b", "c", "d", "e"];
  const letters = el("div", "pp-letters", chars.map((c, i) => (c === " " ? "<em></em>" : `<span class="l${KINDS[(i * 3) % 5]}">${c}</span>`)).join(""), host);
  css(letters, { fontSize: `${Math.min(112, Math.floor(1000 / (chars.length * 0.9)))}px` });
  const spans = [...letters.querySelectorAll("span")];
  const fg = video(C.detoure, host, "vid hidden");
  const st = el("canvas", "pp-sticker", null, host); st.width = W * HALF; st.height = H * HALF;
  const sctx = st.getContext("2d");
  const outline = makeOutline();
  el("div", "pp-x", "✕", host);
  let fitted = false;
  return async (t) => {
    await seekVideo(fg, t);
    if (!fitted) { fitWidth(letters, [...letters.children], 1020); fitted = true; }
    const q = Math.floor(t * 12) / 12; // animation à 12 images par seconde, façon stop-motion
    sctx.clearRect(0, 0, st.width, st.height);
    sctx.drawImage(outline(fg, 13, 0), 0, 0); sctx.drawImage(fg, 0, 0, st.width, st.height);
    const k = clamp(spring(q - 0.12, 2.2, 0.6), 0, 1.08);
    css(st, { opacity: clamp(k * 3), transform: `translate(${lerp(-80, 0, k)}px, ${lerp(260, 150, k)}px) rotate(${lerp(-9, -2.5, k) + Math.sin(q * 25) * 0.6}deg) scale(${lerp(0.7, 0.88, k)})` });
    spans.forEach((s, i) => {
      const ks = spring(q - 0.3 - i * 0.07, 3, 0.6);
      css(s, { opacity: clamp(ks * 3), transform: `rotate(${((i * 37) % 13) - 6 + Math.sin(q * 30 + i) * 2}deg) scale(${lerp(1.8, 1, clamp(ks, 0, 1.1))})` });
    });
  };
};

/** Réduit la taille du texte si ses lettres dépassent `max` pixels (mesure une fois les polices chargées). */
function fitWidth(line, letters, max) {
  const w = letters.reduce((sum, sp) => sum + sp.offsetWidth, 0);
  if (w > max) css(line, { fontSize: `${Math.floor(parseFloat(line.style.fontSize) * (max / w))}px` });
}

// ---------- /texte-derriere : un mot géant passe entre toi et le décor ----------
const HEAD_TOP_MIN = 420; // le mot géant occupe y 360 → 610 : il doit dépasser au-dessus de la tête
const texteDerriere = (C) => (host) => {
  const cam = el("div", "bhcam", null, host);
  const blur = video(C.fond, cam, "vid bhblur");
  const bg = video(C.fond, cam);
  const spans = (s) => [...s].map((c) => `<span>${c === " " ? "&nbsp;" : c}</span>`).join("");
  const words = el("div", "bhwords", `<div class="bh1">${spans(C.haut.toUpperCase())}</div><div class="bh2">${spans(C.mot.toUpperCase())}</div>`, cam);
  const fg = video(C.detoure, cam, "vid bhfg");
  const [b1, b2] = words.children;
  css(b1, { fontSize: `${Math.min(112, Math.floor(1040 / (Math.max(1, C.haut.length) * 0.66)))}px` });
  css(b2, { fontSize: `${Math.min(248, Math.floor(1040 / (Math.max(1, C.mot.length) * 0.7)))}px` });
  const s1 = [...b1.children], s2 = [...b2.children];
  let fitted = false;
  return async (t) => {
    await Promise.all([seekVideo(blur, t), seekVideo(bg, t), seekVideo(fg, t)]);
    if (!fitted) {
      // Largeur max sous 1080 px : la caméra zoome jusqu'à 1,14.
      fitWidth(b1, s1, 880); fitWidth(b2, s2, 900);
      // Tête trop haute pour le mot : on descend la vidéo, le haut libéré montre le décor flouté.
      const shift = clamp(HEAD_TOP_MIN - headOf(fg).top, 0, 420);
      css(bg, { transform: `translateY(${shift}px)`, maskImage: "linear-gradient(transparent, #000 180px)", webkitMaskImage: "linear-gradient(transparent, #000 180px)" });
      css(fg, { transform: `translateY(${shift}px)` });
      css(blur, { visibility: shift > 0 ? "inherit" : "hidden" });
      fitted = true;
    }
    css(cam, { transform: `scale(${lerp(1.0, 1.14, easeInOut(inv(0, 2.2, t)))})` });
    css(words, { transform: `translateY(${lerp(30, -20, inv(0, 2.2, t))}px)` });
    s1.forEach((sp, i) => { const k = spring(t - 0.12 - i * 0.035, 3, 0.7); css(sp, { transform: `translateY(${(1 - clamp(k, 0, 1.1)) * 140}px)`, opacity: clamp(k * 2) }); });
    s2.forEach((sp, i) => {
      const k = spring(t - 0.35 - i * 0.05, 2.4, 0.62);
      css(sp, { transform: `translateY(${(1 - clamp(k, 0, 1.12)) * 420}px) scaleY(${lerp(1.4, 1, clamp(k, 0, 1))})`, opacity: clamp(k * 2), color: t > 1.1 + i * 0.06 ? C.couleur : "#ffffff" });
    });
  };
};

// ---------- /ecran-led : mots en points LED, puis ta vidéo sur l'écran, puis la caméra recule sur un panneau géant ----------
const ecranLed = (C) => (host) => {
  el("div", "ledwall", null, host);
  const frame = el("div", "ledframe", null, host);
  const cv = el("canvas", "ledcv", null, frame); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  const v = C.fond ? video(C.fond, host, "vid ledsrc") : null;
  const GW = 90, GH = 160, P = W / GW;
  const off = document.createElement("canvas"); off.width = GW; off.height = GH;
  const octx = off.getContext("2d", { willReadFrequently: true });
  const txt = document.createElement("canvas"); txt.width = GW; txt.height = GH;
  const xctx = txt.getContext("2d", { willReadFrequently: true });
  const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H;
  const tctx = tmp.getContext("2d");
  const step = C.mots.length > 4 ? 1.5 / (C.mots.length - 1) : 0.5;
  const WORDS = C.mots.map((w, i) => ({ w, t: 0.1 + i * step }));
  const dur = 0.45, tFace = 1.0, tBack = 1.25;
  return async (t) => {
    const faceOn = v && t >= tFace;
    if (v) await seekVideo(v, Math.max(0, t - tFace));
    octx.fillStyle = "#000"; octx.fillRect(0, 0, GW, GH);
    if (faceOn) { octx.globalAlpha = clamp((t - tFace) * 6); octx.drawImage(v, 0, 0, GW, GH); octx.globalAlpha = 1; }
    const face = faceOn ? octx.getImageData(0, 0, GW, GH).data : null;
    // Les mots, dessinés à part pour rester blancs par-dessus la vidéo.
    xctx.clearRect(0, 0, GW, GH);
    WORDS.forEach(({ w, t: tw }, i) => {
      const u = (t - tw) / dur;
      const last = i === WORDS.length - 1; // le dernier mot reste affiché jusqu'à la fin
      if (u < -0.1 || (!last && u > 1.0)) return;
      const k = easeOut(clamp(u + 0.1, 0, 1.1) / 1.1);
      const a = clamp((u + 0.1) * 6) * (last ? 1 : 1 - clamp((u - 0.75) * 5));
      xctx.save(); xctx.translate(GW / 2, faceOn ? GH * 0.78 : GH / 2); xctx.scale(lerp(0.45, faceOn ? 1.05 : 1.25, k), lerp(0.45, faceOn ? 1.05 : 1.25, k));
      xctx.fillStyle = `rgba(255,255,255,${a})`;
      xctx.font = `800 ${w.length > 5 ? Math.max(9, Math.floor(100 / w.length)) : w.length > 4 ? 19 : 28}px Geist, sans-serif`;
      xctx.textAlign = "center"; xctx.textBaseline = "middle"; xctx.fillText(w, 0, 0); xctx.restore();
    });
    const tx = xctx.getImageData(0, 0, GW, GH).data;
    ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, W, H);
    const flick = 0.97 + 0.03 * Math.sin(t * 60), sw = P / 3 - 1;
    for (let y = 0; y < GH; y += 1) {
      for (let x = 0; x < GW; x += 1) {
        const i = (y * GW + x) * 4;
        const wt = (tx[i + 3] / 255) * (tx[i] / 255);
        const base = face ? [face[i], face[i + 1], face[i + 2]] : [0, 0, 0];
        const ch = base.map((c) => Math.min(1, Math.max(0.05, Math.pow(c / 255, 0.6) * 2.1 * (1 - wt) + wt * 1.4)) * flick);
        const px = x * P, py = y * P;
        ctx.fillStyle = `rgba(255,110,95,${ch[0]})`; ctx.fillRect(px + 1, py + 1, sw, P - 3);
        ctx.fillStyle = `rgba(140,255,160,${ch[1]})`; ctx.fillRect(px + 1 + P / 3, py + 1, sw, P - 3);
        ctx.fillStyle = `rgba(130,170,255,${ch[2]})`; ctx.fillRect(px + 1 + (2 * P) / 3, py + 1, sw, P - 3);
      }
    }
    // Flou de zoom au moment où chaque mot jaillit.
    const cur = WORDS.filter((x) => t >= x.t).pop();
    const frac = cur ? clamp((t - cur.t) / dur) : 1;
    const z = 0.05 * (1 - clamp(frac * 1.7)) * (faceOn ? 0.5 : 1);
    if (z > 0.002) {
      tctx.clearRect(0, 0, W, H); tctx.drawImage(cv, 0, 0);
      for (let k = 1; k <= 5; k += 1) { const sc = 1 + z * k; ctx.globalAlpha = 0.24 * (1 - k / 6); ctx.drawImage(tmp, (W - W * sc) / 2, (H - H * sc) / 2, W * sc, H * sc); }
      ctx.globalAlpha = 1;
    }
    // Recul : l'écran devient un panneau géant sur un mur sombre, avec son halo et son reflet.
    const kb = v ? clamp(spring(t - tBack, 1.3, 0.85), 0, 1.03) : 0;
    css(frame, { transform: `translateY(${-120 * kb}px) scale(${lerp(1, 0.68, kb)})`, boxShadow: `0 0 ${lerp(0, 160, kb)}px rgba(150,200,255,${0.35 * kb})` });
  };
};

// ---------- /avant-apres : un curseur glisse sur la vidéo, « avant » à gauche, « après » sous-titré à droite ----------
const avantApres = (C) => (host) => {
  // Sans vidéo « avant », l'avant est simulé (désaturé) et l'après étalonné ; avec, on montre les deux vidéos telles quelles.
  const simule = !C.avant;
  const vb = video(C.avant ?? C.fond, host, `vid${simule ? " cmp-before" : ""}`);
  const after = el("div", "cmp-after", null, host);
  const va = video(C.fond, after, `vid${simule ? " cmp-grade" : ""}`);
  if (simule) el("div", "cmp-warm", null, after);
  const cap = el("div", "cmp-cap", null, after);
  const lb = el("div", "cmp-pill", "AVANT", host);
  const la = el("div", "cmp-pill on", "APRÈS", host);
  const bar = el("div", "cmp-bar", "<i></i><b>‹ ›</b>", host);
  const GROUPS = C.legendes.map((l, i) => ({ t: i === 0 ? 0.4 : 1.12, words: l.split(/\s+/).filter(Boolean) })).slice(0, 2);
  const STEP = 0.2;
  return async (t) => {
    await Promise.all([seekVideo(vb, t), seekVideo(va, t)]);
    // Le curseur part de la droite (presque tout « avant »), s'arrête au milieu, puis repart vers la gauche (presque tout « après »).
    const k1 = clamp(spring(t - 0.2, 1.5, 0.8), 0, 1.04), k2 = clamp(spring(t - 1.2, 1.5, 0.8), 0, 1.04);
    const x = (0.92 - 0.42 * k1 - 0.38 * k2) * W;
    css(after, { clipPath: `inset(0 0 0 ${x}px)` });
    css(bar, { transform: `translateX(${x}px)`, opacity: clamp((t - 0.05) * 6) });
    css(lb, { opacity: clamp((t - 0.1) * 5) * clamp((x - 160) / 200) });
    css(la, { opacity: clamp((t - 0.1) * 5) });
    css(cap, { left: `${x}px`, width: `${W - x}px`, fontSize: `${Math.round(clamp((W - x) / 860, 0.5, 1) * 84)}px` });
    const g = GROUPS.filter((gr) => t >= gr.t).pop();
    if (!g) { cap.innerHTML = ""; return; }
    const n = Math.min(g.words.length, Math.floor((t - g.t) / STEP) + 1);
    cap.innerHTML = g.words.slice(0, n).map((w, i) => `<span class="${i === n - 1 ? "hot" : ""}">${w}</span>`).join(" ");
    const kc = spring(t - g.t - (n - 1) * STEP, 4, 0.55);
    css(cap.lastElementChild, { transform: `scale(${lerp(0.6, 1, clamp(kc, 0, 1.15))})` });
  };
};

export const EFFETS = {
  "carrousel-3d": carrousel,
  "papier-decoupe": papier,
  "texte-derriere": texteDerriere,
  "ecran-led": ecranLed,
  doodle,
  "avant-apres": avantApres,
};
