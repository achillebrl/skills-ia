// Rendu de la pub, image par image, avec Playwright et ffmpeg.
// Usage :
//   node scripts/rendu.mjs <dossier-marque> apercu 0.5 3 6 …   -> <dossier>/apercu.jpg (planche des instants demandés)
//   node scripts/rendu.mjs <dossier-marque> [fps]               -> <dossier>/pub.mp4 (1920 × 1080)
// Son : <dossier>/voix.mp3 si présent, plus <dossier>/musique.mp3 si présent (baissée sous la voix), volume −14 LUFS.
import { chromium } from "playwright";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };

const [dossierArg, mode = "30", ...instants] = process.argv.slice(2);
if (!dossierArg) throw new Error("usage : node scripts/rendu.mjs <dossier-marque> [fps | apercu t1 t2 …]");
const dossier = path.resolve(dossierArg);
if (!dossier.startsWith(RACINE)) throw new Error("le dossier de la marque doit être dans le dossier du skill (ex. marques/ma-marque)");
const relatif = path.relative(RACINE, dossier).split(path.sep).join("/");

function serveur() {
  const s = http.createServer((req, res) => {
    const fichier = path.join(RACINE, decodeURIComponent((req.url ?? "/").split("?")[0]));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fichier)] ?? "application/octet-stream" });
    fs.createReadStream(fichier).pipe(res);
  });
  return new Promise((ok) => s.listen(0, "127.0.0.1", () => ok(s)));
}

function lancer(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "inherit", "inherit"] });
  if (r.status !== 0) throw new Error(`${cmd} a échoué (${r.status})`);
}

const srv = await serveur();
const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const erreurs = [];
page.on("pageerror", (e) => erreurs.push(e.message));
await page.goto(`http://127.0.0.1:${srv.address().port}/moteur/pub.html?marque=${encodeURIComponent(relatif)}`);
try {
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
} catch {
  throw new Error(`la page ne démarre pas : ${erreurs.join(" | ") || "délai dépassé"}`);
}
const fermer = async () => {
  await navigateur.close();
  srv.close();
};

if (mode === "apercu") {
  const temps = instants.map(Number);
  const images = [];
  for (const [i, t] of temps.entries()) {
    await page.evaluate((s) => window.seek(s), t);
    const f = path.join(dossier, `.apercu_${i}.jpg`);
    await page.screenshot({ path: f, type: "jpeg", quality: 85 });
    images.push(f);
  }
  await fermer();
  const cols = Math.min(4, images.length);
  const sortie = path.join(dossier, "apercu.jpg");
  if (images.length === 1) lancer("ffmpeg", ["-v", "error", "-y", "-i", images[0], "-vf", "scale=640:-1", sortie]);
  else lancer("ffmpeg", ["-v", "error", "-y", ...images.flatMap((f) => ["-i", f]), "-filter_complex",
    `${images.map((_, i) => `[${i}]scale=640:360[v${i}]`).join(";")};${images.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${images.length}:layout=${images.map((_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join("|")}:fill=black`,
    "-frames:v", "1", sortie]);
  images.forEach((f) => fs.unlinkSync(f));
  if (erreurs.length) console.error(`erreurs de la page : ${erreurs.join(" | ")}`);
  console.log(`OK -> ${path.relative(process.cwd(), sortie)}`);
  process.exit(0);
}

const fps = Number(mode);
const duree = await page.evaluate(() => window.duration);
const muette = path.join(dossier, ".pub_muette.mp4");
const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
  "-vf", "format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "17", muette], { stdio: ["pipe", "inherit", "inherit"] });
const images = Math.ceil(duree * fps);
for (let f = 0; f < images; f++) {
  await page.evaluate((s) => window.seek(s), f / fps);
  if (!ff.stdin.write(await page.screenshot({ type: "jpeg", quality: 93 }))) await once(ff.stdin, "drain");
  if (f % 150 === 0) console.log(`image ${f}/${images}`);
}
ff.stdin.end();
await once(ff, "exit");
await fermer();

// Son : voix au premier plan, musique à −16 dB sous la voix, puis −14 LUFS (cible Instagram / TikTok / YouTube).
const voix = path.join(dossier, "voix.mp3");
const musique = path.join(dossier, "musique.mp3");
const sortie = path.join(dossier, "pub.mp4");
const entrees = ["-i", muette];
const pistes = [];
if (fs.existsSync(voix)) { entrees.push("-i", voix); pistes.push(`[${pistes.length + 1}:a]adelay=300|300,apad[v]`); }
if (fs.existsSync(musique)) { entrees.push("-stream_loop", "-1", "-i", musique); pistes.push(`[${pistes.length + 1}:a]volume=-16dB,afade=t=out:st=${Math.max(0, duree - 1.2)}:d=1.2[m]`); }
if (!pistes.length) lancer("ffmpeg", ["-v", "error", "-y", "-i", muette, "-c", "copy", "-movflags", "+faststart", sortie]);
else {
  const noms = pistes.map((p) => p.slice(p.lastIndexOf("[")));
  const mix = noms.length > 1 ? `${pistes.join(";")};${noms.join("")}amix=inputs=${noms.length}:normalize=0,loudnorm=I=-14:TP=-1.5[a]` : `${pistes[0]};${noms[0]}loudnorm=I=-14:TP=-1.5[a]`;
  lancer("ffmpeg", ["-v", "error", "-y", ...entrees, "-filter_complex", mix, "-map", "0:v", "-map", "[a]", "-t", String(duree),
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", sortie]);
}
fs.unlinkSync(muette);
if (erreurs.length) console.error(`erreurs de la page : ${erreurs.join(" | ")}`);
console.log(`OK -> ${path.relative(process.cwd(), sortie)} (${duree.toFixed(1)} s, ${images} images)`);
