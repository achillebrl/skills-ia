// Monte l'effet décrit par config.json (?c=…) et expose window.seek(t) au script de rendu.
import { EFFETS } from "./effets.js";

const C = await (await fetch(new URLSearchParams(location.search).get("c"))).json();
const update = EFFETS[C.effet](C)(document.getElementById("stage"));
window.duration = C.duree;
window.seek = (t) => update(t);
await document.fonts.ready;
await Promise.all([...document.images].map((im) => (im.complete ? 1 : new Promise((ok) => { im.onload = im.onerror = ok; }))));
await Promise.all([...document.querySelectorAll("video")].map((v) => v.ready));
await window.seek(0);
window.ready = true;
