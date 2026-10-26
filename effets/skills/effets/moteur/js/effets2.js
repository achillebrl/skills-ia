// Les 6 effets de la série 2 (1080 × 1920). Même contrat que effets.js : effet(C)(host) → async update(t).
import { H, W, clamp, css, easeInOut, el, inv, lerp, rng, seekVideo, spring, video } from "./core.js";
import { makeOutline } from "./effets.js";

const HALF = 0.5;
const pop = (t, f = 3, z = 0.6, max = 1.12) => clamp(spring(t, f, z), 0, max);
/** Temps en aller-retour dans une vidéo de durée `d` : pas de saut quand on dépasse la fin. */
const pingPong = (x, d) => { const L = Math.max(0.1, d - 0.1), m = x % (2 * L); return m > L ? 2 * L - m : m; };

/** Silhouette épaissie de `r` px et teinte en `color` (demi-résolution). */
function tintedOutline() {
  const outline = makeOutline();
  const c = document.createElement("canvas"); c.width = W * HALF; c.height = H * HALF;
  const ctx = c.getContext("2d");
  return (vid, r, inner, color) => {
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(outline(vid, r, inner), 0, 0);
    ctx.globalCompositeOperation = "source-in"; ctx.fillStyle = color; ctx.fillRect(0, 0, c.width, c.height);
    return c;
  };
}

// ---------- /clones : deux autres toi débarquent de chaque côté, à d'autres moments de ta vidéo ----------
const clones = (C) => (host) => {
  const bg = video(C.fond, host);
  const side = [video(C.detoure, host, "vid clone"), video(C.detoure, host, "vid clone")];
  const mid = video(C.detoure, host);
  const flash = el("div", "clflash", null, host);
  const tag = el("div", "cltag", C.texte, host);
  const T = [0.22, 0.58];
  return async (t) => {
    const d = mid.duration || C.duree;
    await Promise.all([seekVideo(bg, t), seekVideo(mid, t), seekVideo(side[0], pingPong(t + d * 0.35, d)), seekVideo(side[1], pingPong(t + d * 0.7, d))]);
    side.forEach((v, i) => {
      const k = pop(t - T[i], 3.2, 0.55, 1.15), dir = i === 0 ? -1 : 1;
      css(v, { opacity: clamp(k * 4), transform: `translate(${dir * lerp(140, 380, clamp(k))}px, ${lerp(-160, -40, clamp(k))}px) scale(${lerp(1.25, 0.9, clamp(k, 0, 1.15))})` });
    });
    css(flash, { opacity: 0.55 * T.reduce((m, x) => Math.max(m, t >= x ? Math.exp(-(t - x) * 14) : 0), 0) });
    const kt = pop(t - 0.95, 3.4, 0.55);
    css(tag, { opacity: clamp(kt * 3), transform: `translate(-50%, 0) rotate(-6deg) scale(${lerp(2.2, 1, clamp(kt, 0, 1.12))})` });
  };
};

// ---------- /vhs : caméscope 1998 (couleurs qui bavent, lignes, tracking, sauts, date à l'écran) ----------
const vhs = (C) => (host) => {
  const v = video(C.fond, host, "vid hidden");
  const cv = el("canvas", "vhscv", null, host); cv.width = W * HALF; cv.height = H * HALF;
  const ctx = cv.getContext("2d");
  const COLORS = ["#ff0000", "#00ff00", "#0000ff"];
  const ch = COLORS.map(() => { const c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; return c; });
  const tmp = document.createElement("canvas"); tmp.width = cv.width; tmp.height = cv.height;
  el("div", "vhslines", null, host);
  const band = el("div", "vhsband", null, host);
  const ncv = el("canvas", "vhsnoise", null, host); ncv.width = 270; ncv.height = 480;
  const nctx = ncv.getContext("2d"), nimg = nctx.createImageData(ncv.width, ncv.height);
  const osd = el("div", "vhsosd", `<div class="vp">▶ PLAY</div><div class="vs">SP</div><div class="vr">● REC</div><div class="vd">${C.texte}</div><div class="vt"></div>`, host);
  const vt = osd.querySelector(".vt"), vr = osd.querySelector(".vr");
  const GLITCH = [0.32, 0.86, 1.42, 2.3, 3.1];
  return async (t) => {
    await seekVideo(v, t);
    const g = GLITCH.find((x) => t >= x && t < x + 0.13);
    const dx = g ? 14 : 4;
    ch.forEach((c, i) => {
      const x = c.getContext("2d");
      x.globalCompositeOperation = "source-over"; x.filter = "saturate(1.5) contrast(1.15) blur(1px)";
      x.drawImage(v, 0, 0, c.width, c.height); x.filter = "none";
      x.globalCompositeOperation = "multiply"; x.fillStyle = COLORS[i]; x.fillRect(0, 0, c.width, c.height);
    });
    ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(ch[0], -dx, 0); ctx.drawImage(ch[1], 0, 0); ctx.drawImage(ch[2], dx, 0);
    ctx.globalCompositeOperation = "source-over";
    if (g) {
      tmp.getContext("2d").clearRect(0, 0, tmp.width, tmp.height); tmp.getContext("2d").drawImage(cv, 0, 0);
      for (let k = 0; k < 7; k += 1) {
        const y = (k * 131 + Math.floor(g * 100)) % 900, hh = 18 + ((k * 37) % 50), sh = (k % 2 ? 1 : -1) * (30 + ((k * 53) % 70));
        ctx.drawImage(tmp, 0, y, tmp.width, hh, sh, y, tmp.width, hh);
      }
    }
    css(band, { transform: `translateY(${((t * 520) % 1300) - 200}px)`, opacity: g ? 0.9 : 0.45 });
    const r = rng(1 + Math.floor(t * 24));
    for (let i = 0; i < nimg.data.length; i += 4) { const n = r() * 255; nimg.data[i] = nimg.data[i + 1] = nimg.data[i + 2] = n; nimg.data[i + 3] = 255; }
    nctx.putImageData(nimg, 0, 0);
    vt.textContent = `PM 9:04:${String(4 + (Math.floor(t * 30) % 50)).padStart(2, "0")}`;
    vr.style.opacity = Math.floor(t * 2.5) % 2 === 0 ? 1 : 0.2;
    css(osd, { transform: g ? "translateX(8px)" : "none" });
  };
};

// ---------- /neon : contour en néon qui s'allume, avec trois échos colorés de tes gestes ----------
const neon = (C) => (host) => {
  const bg = video(C.fond, host, "vid neonbg");
  el("div", "neontint", null, host);
  const ECHO = [{ d: 0.36, c: "#7a5cff", a: 0.45 }, { d: 0.24, c: "#ff2bd6", a: 0.6 }, { d: 0.12, c: "#00e5ff", a: 0.8 }];
  const echoes = ECHO.map(() => ({ v: video(C.detoure, host, "vid hidden"), draw: tintedOutline() }));
  const ecv = el("canvas", "neoncv", null, host); ecv.width = W * HALF; ecv.height = H * HALF;
  const ectx = ecv.getContext("2d");
  const fg = video(C.detoure, host, "vid neonfg");
  const main = tintedOutline();
  const mcv = el("canvas", "neoncv neonmain", null, host); mcv.width = W * HALF; mcv.height = H * HALF;
  const mctx = mcv.getContext("2d");
  const txt = el("div", "neontxt", C.texte, host);
  const lit = (x) => (x < 0 ? 0 : x > 0.32 ? 1 : [1, 0, 1, 0.2, 1, 0, 1, 1][Math.floor(x / 0.04)]); // un tube qui clignote avant de tenir
  return async (t) => {
    await Promise.all([seekVideo(bg, t), seekVideo(fg, t), ...echoes.map((e, i) => seekVideo(e.v, Math.max(0, t - ECHO[i].d)))]);
    ectx.clearRect(0, 0, ecv.width, ecv.height);
    echoes.forEach((e, i) => { ectx.globalAlpha = ECHO[i].a * clamp((t - 0.45 - i * 0.08) * 4); ectx.drawImage(e.draw(e.v, 7, 4, ECHO[i].c), 0, 0); });
    ectx.globalAlpha = 1;
    mctx.clearRect(0, 0, mcv.width, mcv.height); mctx.drawImage(main(fg, 8, 4, "#e9fbff"), 0, 0);
    css(mcv, { opacity: lit(t - 0.08) });
    css(txt, { opacity: lit(t - 0.85) });
  };
};

// ---------- /mosaique : ton titre en 60 tuiles qui se retournent en vague sur ta vidéo ----------
const mosaique = (C) => (host) => {
  const v = video(C.fond, host, "vid hidden");
  const COLS = 6, ROWS = 10, TW = W / COLS, TH = H / ROWS;
  const wrap = el("div", "mowrap", null, host);
  const tiles = [];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const t = el("div", "motile", null, wrap);
      css(t, { left: `${c * TW}px`, top: `${r * TH}px`, width: `${TW}px`, height: `${TH}px` });
      const front = el("div", "moface mofront", `<div class="moposter" style="transform:translate(${-c * TW}px,${-r * TH}px)">
        <div class="mp1">${C.haut}</div><div class="mp2">${C.mot}</div><div class="mp3">${C.texte}</div></div>`, t);
      css(front, { background: C.couleur });
      const back = el("canvas", "moface moback", null, t); back.width = Math.round(TW); back.height = Math.round(TH);
      tiles.push({ t, ctx: back.getContext("2d"), c, r });
    }
  }
  return async (t) => {
    await seekVideo(v, t);
    const cover = Math.min(v.videoWidth / W, v.videoHeight / H);
    const ox = (v.videoWidth - W * cover) / 2, oy = (v.videoHeight - H * cover) / 2;
    tiles.forEach(({ t: tile, ctx, c, r }) => {
      ctx.drawImage(v, ox + c * TW * cover, oy + r * TH * cover, TW * cover, TH * cover, 0, 0, TW, TH);
      const k = clamp(spring(t - 0.4 - (c + r) * 0.045, 1.9, 0.62), 0, 1.08);
      css(tile, { transform: `rotateY(${180 * k}deg) scale(${1 - 0.12 * Math.sin(Math.PI * clamp(k))})` });
    });
    css(wrap, { transform: `scale(${lerp(1.0, 1.06, easeInOut(inv(0, 2, t)))})` });
  };
};

// ---------- /bd : toi en case de bande dessinée (trame, contour encré, bulle, onomatopée) ----------
const bd = (C) => (host) => {
  el("div", "bdbg", null, host);
  const fg = video(C.detoure, host, "vid hidden");
  const ink = tintedOutline();
  const cv = el("canvas", "bdcv", null, host); cv.width = W * HALF; cv.height = H * HALF;
  const ctx = cv.getContext("2d");
  const dots = document.createElement("canvas"); dots.width = 12; dots.height = 12;
  const dctx = dots.getContext("2d"); dctx.fillStyle = "rgba(0,0,0,.45)"; dctx.beginPath(); dctx.arc(6, 6, 2.6, 0, Math.PI * 2); dctx.fill();
  const shade = document.createElement("canvas"); shade.width = cv.width; shade.height = cv.height;
  const sctx = shade.getContext("2d");
  const pow = el("div", "bdpow", `<svg viewBox="0 0 200 200" width="420" height="420"><polygon fill="#ffd400" stroke="#111" stroke-width="7" points="100,4 122,62 186,40 146,92 198,128 134,132 150,196 100,150 50,196 66,132 2,128 54,92 14,40 78,62"/><text x="100" y="118" text-anchor="middle" font-family="Geist" font-weight="900" font-style="italic" font-size="44" fill="#e8261e" stroke="#111" stroke-width="2.5">${C.mot}</text></svg>`, host);
  const bubble = el("div", "bdbubble", C.texte, host);
  el("div", "bdframe", null, host);
  return async (t) => {
    await seekVideo(fg, t);
    const q = Math.floor(t * 12) / 12; // 12 images par seconde, comme une BD animée
    // Trame de points façon impression BD, posée uniquement sur la personne.
    sctx.globalCompositeOperation = "source-over"; sctx.clearRect(0, 0, shade.width, shade.height);
    sctx.fillStyle = sctx.createPattern(dots, "repeat"); sctx.fillRect(0, 0, shade.width, shade.height);
    sctx.globalCompositeOperation = "destination-in"; sctx.drawImage(fg, 0, 0, shade.width, shade.height);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(ink(fg, 6, 0, "#111"), 0, 0);
    ctx.filter = "contrast(1.45) saturate(1.6) brightness(1.08)"; ctx.drawImage(fg, 0, 0, cv.width, cv.height); ctx.filter = "none";
    ctx.globalCompositeOperation = "multiply"; ctx.drawImage(shade, 0, 0); ctx.globalCompositeOperation = "source-over";
    css(cv, { transform: `translate(${Math.sin(q * 21) * 3}px, 40px) rotate(${Math.sin(q * 17) * 0.4}deg) scale(0.94)` });
    const kp = pop(q - 0.12, 3.2, 0.5, 1.2);
    css(pow, { opacity: clamp(kp * 4), transform: `rotate(${-14 + Math.sin(q * 9) * 3}deg) scale(${lerp(0.2, 1, kp)})` });
    const kb = pop(q - 0.5, 3, 0.55, 1.15);
    css(bubble, { opacity: clamp(kb * 4), transform: `rotate(-3deg) scale(${lerp(0.3, 1, kb)})` });
  };
};

// ---------- /mise-en-abyme : ta vidéo dans ta vidéo dans ta vidéo… et la caméra plonge sans fin ----------
const miseEnAbyme = (C) => (host) => {
  const S = 0.46, N = 7, P = { x: 540, y: 1180 };
  const zoom = el("div", "abzoom", null, host);
  css(zoom, { transformOrigin: `${P.x}px ${P.y}px` });
  const layers = Array.from({ length: N }, (_, i) => {
    const l = el("div", `ablayer${i ? " abin" : ""}`, null, zoom);
    css(l, { transformOrigin: `${P.x}px ${P.y}px`, transform: `scale(${Math.pow(S, i)})`, zIndex: String(i) });
    return video(C.fond, l);
  });
  return async (t) => {
    await Promise.all(layers.map((v) => seekVideo(v, t)));
    // À chaque niveau, l'image intérieure prend exactement la place de l'écran : la plongée boucle sans couture.
    const levels = Math.max(1, Math.round(C.duree / 1.6));
    css(zoom, { transform: `scale(${Math.pow(1 / S, levels * easeInOut(inv(0.15, C.duree - 0.2, t)))})` });
  };
};


// ---------- /todo-list : une liste qui se coche toute seule à côté de toi ; une ligne qui commence par « - » se fait barrer ----------
const todoList = (C) => (host) => {
  const v = video(C.fond, host);
  el("div", "tdshade", null, host);
  const items = C.mots.map((m) => ({ t: m.replace(/^-\s*/, ""), ok: !m.startsWith("-") }));
  const card = el("div", "tdcard", `<div class="tdh">${C.haut}</div>${items.map((x) => `<div class="tdrow${x.ok ? "" : " no"}">
    <span class="tdbox"><svg viewBox="0 0 40 40"><path pathLength="1" d="${x.ok ? "M9 21 L17 29 L31 12" : "M11 11 L29 29 M29 11 L11 29"}"/></svg></span>
    <span class="tdt">${x.t}<i></i></span></div>`).join("")}`, host);
  const rows = [...card.querySelectorAll(".tdrow")];
  const T0 = 0.5, STEP = Math.min(0.3, 1.6 / Math.max(1, rows.length));
  return async (t) => {
    await seekVideo(v, t);
    const kc = pop(t - 0.08, 2.6, 0.7, 1.06);
    css(card, { opacity: clamp(kc * 3), transform: `translateX(${(1 - clamp(kc, 0, 1.06)) * 260}px) rotate(${lerp(6, 2, clamp(kc))}deg)` });
    rows.forEach((r, i) => {
      const x = t - T0 - i * STEP;
      r.querySelector(".tdbox").style.transform = `scale(${x > 0 ? lerp(0.6, 1, pop(x, 4, 0.5, 1.2)) : 1})`;
      r.querySelector("path").style.strokeDashoffset = String(1 - clamp(x / 0.14));
      r.classList.toggle("on", x > 0);
      r.querySelector("i").style.width = `${100 * clamp((x - 0.06) / 0.2)}%`;
    });
  };
};

export const EFFETS2 = { clones, vhs, neon, mosaique, bd, "mise-en-abyme": miseEnAbyme, "todo-list": todoList };
