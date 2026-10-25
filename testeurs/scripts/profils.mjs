// Profils des testeurs du skill « testeurs » et attaque exécutée dans la page (gremlins.js + gremlins maison).

// 5 façons de « faire n'importe quoi ». L'appareil vient de la liste des testeurs.
export const PROFILS = {
  presse: { nom: "le pressé" },
  distrait: { nom: "le distrait" },
  farceur: { nom: "le farceur" },
  navigateur: { nom: "le baladeur" },
  pouce: { nom: "le pouce" },
};

const PRENOMS = ["Léa", "Hugo", "Inès", "Karim", "Chloé", "Lucas", "Manon", "Yanis", "Sarah", "Théo", "Camille", "Nathan", "Jade", "Mehdi", "Emma", "Louis", "Zoé", "Rayan", "Lina", "Tom"];
const STYLES = ["presse", "distrait", "farceur", "navigateur", "pouce"];

/** Les N testeurs : style en rotation, un sur deux sur mobile (toujours sur mobile pour « le pouce »), une graine fixe par testeur. */
export function testeurs(n) {
  return Array.from({ length: n }, (_, i) => {
  const style = STYLES[i % STYLES.length];
    return { id: i + 1, prenom: PRENOMS[i % PRENOMS.length], style, appareil: style === "pouce" || i % 2 ? "mobile" : "ordinateur", graine: 1000 + i * 37 };
  });
}

/** Exécutée dans la page par page.evaluate : elle ne doit rien utiliser de l'extérieur (Playwright la sérialise). */
export async function attaque({ graine, actions, style }) {
  const G = window.gremlins;
  const log = (m) => window.__testeur && window.__testeur(m);
  const logger = { log: (...a) => log(a.join(" ")), info: (...a) => log(a.join(" ")), warn: (...a) => log(a.join(" ")), error: (...a) => log(a.join(" ")) };
  const visible = (el) => el.offsetParent !== null && !el.disabled && el.getBoundingClientRect().width > 0;
  const desc = (el) => {
    const txt = (el.innerText || el.value || el.getAttribute("aria-label") || el.name || el.placeholder || el.id || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return el.tagName.toLowerCase() + (el.type ? "[" + el.type + "]" : "") + (txt ? " « " + txt + " »" : "");
  };
  const BIZARRE = ["😀🔥🚀", "", "   ", "3000", "01/01/3000", "-1", "0", "12,5", "99999999999999999999", "x".repeat(3000), "Ünïcødé ñ ß", "مرحبا بالعالم", "null", "NaN"];
  const ecrire = (c, v) => {
    const proto = c.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(c, v);
    c.dispatchEvent(new Event("input", { bubbles: true }));
    c.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const champs = () => [...document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea")].filter(visible);
  const boutons = () => [...document.querySelectorAll("button, a[href], [role=button], input[type=submit], summary, label")].filter(visible);
  const bizarre = ({ randomizer }) => () => {
    const cs = champs(); if (!cs.length) return;
    const c = randomizer.pick(cs);
    const v = c.type === "date" ? "3000-01-01" : c.type === "number" ? randomizer.pick(["-1", "0", "3000", "99999999", "12.5"]) : c.type === "email" ? randomizer.pick(["", "pas-un-email", "a@b"]) : randomizer.pick(BIZARRE);
    try { ecrire(c, v); } catch (e) { return; }
    log("écrit « " + v.slice(0, 24) + (v.length > 24 ? "… (" + v.length + " car.)" : "") + " » dans " + desc(c));
  };
  const vider = ({ randomizer }) => () => {
    const cs = champs(); if (!cs.length) return;
    const c = randomizer.pick(cs); ecrire(c, ""); log("vide " + desc(c));
  };
  const envoyer = ({ randomizer }) => () => {
    const fs = [...document.forms].filter((f) => visible(f) || f.offsetParent !== null); if (!fs.length) return;
    const f = randomizer.pick(fs);
    log("envoie le formulaire " + (f.getAttribute("name") || f.id || f.action || ""));
    // Valeurs absurdes que le navigateur laisse passer (pas de règle de validation) : signalées comme bug possible.
    const absurdes = [...f.elements].filter((c) => c.value && (/^\s+$|😀|^-\d|^0$|^9{12,}|x{50,}|^NaN$|^null$/.test(c.value) || /(^|\D)(2[1-9]|[3-9]\d)\d\d(\D|$)/.test(c.value)));
    if (f.checkValidity()) absurdes.forEach((c) => log("ALERTE le champ « " + (c.name || c.type) + " » accepte : " + c.value.slice(0, 20)));
    try { f.requestSubmit ? f.requestSubmit() : f.submit(); } catch (e) { log("envoi refusé : " + e.message); }
  };
  const bouton = ({ randomizer }) => () => {
    const bs = boutons(); if (!bs.length) return;
    const b = randomizer.pick(bs); log("clic sur " + desc(b)); b.click();
  };
  const doubleClic = ({ randomizer }) => () => {
    const bs = boutons(); if (!bs.length) return;
    const b = randomizer.pick(bs); log("double clic sur " + desc(b));
    b.click(); b.click(); b.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  };
  const balade = ({ randomizer }) => () => {
    const r = randomizer.integer({ min: 0, max: 5 });
    if (r === 0) { log("bouton retour du navigateur"); history.back(); }
    else if (r === 1) { log("bouton suivant du navigateur"); history.forward(); }
    else if (r === 2) { log("recharge la page"); location.reload(); }
  };
  const S = G.species;
  const especes = {
    presse: [doubleClic, bouton, doubleClic, envoyer, S.clicker({ showAction: () => {} })],
    distrait: [vider, envoyer, bouton, S.scroller({ showAction: () => {} }), balade],
    farceur: [bizarre, bizarre, envoyer, bouton, S.formFiller({ showAction: () => {} })],
    navigateur: [balade, bouton, S.scroller({ showAction: () => {} }), bouton],
    pouce: [S.toucher({ showAction: () => {} }), bouton, bizarre, S.scroller({ showAction: () => {} }), doubleClic],
  }[style];
  await G.createHorde({
    species: especes,
    mogwais: [G.mogwais.alert()],
    strategies: [G.strategies.distribution({ delay: style === "presse" ? 40 : 120, nb: actions })],
    randomizer: new G.Chance(graine),
    logger,
  }).unleash();
}
