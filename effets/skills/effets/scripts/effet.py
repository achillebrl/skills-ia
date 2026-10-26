# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright>=1.47", "imageio-ffmpeg>=0.5", "numpy", "pillow", "rembg[cpu]>=2.0.61"]
# ///
"""Rend un effet vidéo vertical (1080 × 1920, 30 i/s) à partir de ta vidéo, image par image.

    uv run effet.py <effet> --video ma-video.mp4 [options]
    uv run effet.py installer        (première fois : Chromium + modèle de détourage)

Effets : carrousel-3d, papier-decoupe, texte-derriere, ecran-led, doodle, avant-apres,
clones, vhs, neon, mosaique, bd, mise-en-abyme, todo-list.
Étapes : la vidéo est recadrée en 9:16 et découpée (--debut, --duree) ; pour papier-decoupe, texte-derriere, doodle, clones, neon et bd,
la personne est détourée sur ta machine (rembg) ; la page moteur/effet.html est ensuite rendue avec Playwright,
4 sous-images par image pour le flou de mouvement ; le son d'origine est gardé.
Sortie : effets-sortie/<effet>-<date>.mp4 + une planche de 6 images (…-planche.jpg) pour vérifier d'un coup d'œil."""
from __future__ import annotations

import argparse, asyncio, functools, hashlib, http.server, json, shutil, subprocess, sys, threading, time
from datetime import datetime
from pathlib import Path

import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
MOTEUR = Path(__file__).resolve().parent.parent / "moteur"
W, H, FPS = 1080, 1920, 30
DETOURE = {"papier-decoupe", "texte-derriere", "doodle", "clones", "neon", "bd"}
VIDEO_FACULTATIVE = {"carrousel-3d", "ecran-led"}
MODELES = {"rapide": "isnet-general-use", "fin": "birefnet-portrait"}
DEFAUTS = {
    "texte": {"papier-decoupe": "UN PROMPT", "doodle": "un seul prompt", "clones": "×3", "vhs": "OCT. 26 1998",
              "neon": "un seul prompt", "bd": "UN SEUL PROMPT !", "mosaique": "et tout se retourne"},
    "haut": "UN SEUL", "mot": {"bd": "POW!"}, "mots": "Tout|fait|en un|prompt", "todo": "Filmer 5 secondes|Taper une commande|Exporter le clip|-Apprendre After Effects", "legendes": "Un seul prompt.|Rendu pro.",
}


def ff(*args: str) -> None:
    subprocess.run([FF, "-v", "error", "-y", *args], check=True)


def duree_video(path: Path) -> float:
    return float(imageio_ffmpeg.count_frames_and_secs(str(path))[1])


def a_du_son(path: Path) -> bool:
    out = subprocess.run([FF, "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    return "Audio:" in out


def preparer(src: Path, dst: Path, debut: float, duree: float) -> None:
    """Recadre en 1080 × 1920 (centré), 30 i/s, toutes les images en clé pour un positionnement exact à chaque image."""
    ff("-ss", f"{debut:.3f}", "-t", f"{duree + 0.3:.3f}", "-i", str(src),
       "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},setsar=1",
       "-c:v", "libx264", "-g", "1", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", str(dst))


def detourer(fond: Path, dst: Path, modele: str, travail: Path) -> None:
    """Masque de la personne image par image (rembg, en local), lissé dans le temps, puis WebM VP9 avec transparence."""
    from PIL import Image
    from rembg import new_session, remove

    img, msk = travail / "img", travail / "msk"
    for d in (img, msk):
        shutil.rmtree(d, ignore_errors=True); d.mkdir(parents=True)
    ff("-i", str(fond), "-vf", "scale=540:960", str(img / "%04d.png"))
    frames = sorted(img.glob("*.png"))
    session = new_session(modele)
    t0 = time.time()
    for i, f in enumerate(frames, 1):
        remove(Image.open(f), session=session, only_mask=True).save(msk / f.name)
        if i % 15 == 0 or i == len(frames):
            print(f"détourage {i}/{len(frames)} ({time.time() - t0:.0f} s)", flush=True)
    ff("-i", str(fond), "-framerate", str(FPS), "-i", str(msk / "%04d.png"), "-filter_complex",
       f"[1]scale={W}:{H},tmix=frames=3,format=gray[m];[0][m]alphamerge,format=yuva420p",
       "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-g", "1", "-b:v", "0", "-crf", "28", "-an", str(dst))
    shutil.rmtree(img); shutil.rmtree(msk)


def preparer_images(sources: list[Path], media: Path) -> list[str]:
    """Cartes du carrousel : recadrées en 9:16 (760 × 1352)."""
    from PIL import Image, ImageOps

    urls = []
    for i, s in enumerate(sources):
        ImageOps.fit(Image.open(s).convert("RGB"), (760, 1352)).save(media / f"img_{i}.jpg", quality=92)
        urls.append(f"/media/img_{i}.jpg")
    return urls


class Pages(http.server.SimpleHTTPRequestHandler):
    """Sert le moteur à la racine et le dossier de travail sous /media/."""
    media: Path

    def translate_path(self, path: str) -> str:
        path = path.split("?", 1)[0]
        if path.startswith("/media/"):
            return str(self.media / path[len("/media/"):])
        return str(MOTEUR / path.lstrip("/"))

    def log_message(self, format: str, *args) -> None:  # noqa: A002 — pas de journal des requêtes
        pass


def serveur(media: Path) -> http.server.ThreadingHTTPServer:
    handler = type("PagesMedia", (Pages,), {"media": media})
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(handler, directory=str(MOTEUR)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


async def lancer_chromium(p):
    try:
        return await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    except Exception as err:  # Chromium pas encore installé : on l'installe une fois puis on relance.
        if "Executable doesn't exist" not in str(err):
            raise
        print("Installation de Chromium pour Playwright (une seule fois)…", flush=True)
        subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)
        return await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])


async def rendre(url: str, duree: float, sub: int, dossier: Path) -> None:
    from playwright.async_api import async_playwright

    n, k = int(round(duree * FPS)), 0
    offs = [(j - (sub - 1) / 2) / (FPS * sub) for j in range(sub)]
    async with async_playwright() as p:
        b = await lancer_chromium(p)
        pg = await b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        erreurs: list[str] = []
        pg.on("pageerror", lambda e: erreurs.append(str(e)))
        await pg.goto(url)
        try:
            await pg.wait_for_function("window.ready === true", timeout=120000)
        except Exception:
            raise SystemExit(f"La page ne s'est pas chargée : {erreurs[:3] or 'délai dépassé'}")
        stage = await pg.query_selector("#stage")
        for i in range(n):
            for o in offs:
                t = min(duree - 1e-3, max(0.0, i / FPS + o))
                await pg.evaluate(f"window.seek({t})")
                await stage.screenshot(path=str(dossier / f"s_{k:05d}.jpg"), type="jpeg", quality=95); k += 1
            if i % 30 == 0:
                print(f"rendu {i}/{n}", flush=True)
        await b.close()
    if erreurs:
        raise SystemExit(f"Erreurs dans la page : {erreurs[:3]}")


def encoder(dossier: Path, sub: int, fond: Path | None, sortie: Path) -> None:
    vf = (f"tmix=frames={sub},select='eq(mod(n\\,{sub})\\,{sub - 1})',setpts=N/{FPS}/TB,"
          "scale=out_range=tv:out_color_matrix=bt709,format=yuv420p")
    audio = ["-i", str(fond), "-map", "0:v", "-map", "1:a?", "-c:a", "aac", "-b:a", "192k", "-shortest"] if fond and a_du_son(fond) else []
    ff("-framerate", str(FPS * sub), "-i", str(dossier / "s_%05d.jpg"), *audio, "-vf", vf, "-r", str(FPS),
       "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-color_range", "tv", "-colorspace", "bt709",
       "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", str(sortie))
    n = int(round(duree_video(sortie) * FPS))
    ff("-i", str(sortie), "-vf", f"select='not(mod(n\\,{max(1, n // 6)}))',scale=270:-1,tile=6x1", "-frames:v", "1",
       str(sortie.with_name(sortie.stem + "-planche.jpg")))


def installer() -> None:
    from rembg import new_session

    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)
    new_session(MODELES["rapide"])
    print("Prêt : Chromium et le modèle de détourage sont installés.")


def config(a: argparse.Namespace, fond: bool, detoure: bool, avant: bool, images: list[str]) -> dict:
    texte = a.texte or DEFAUTS["texte"].get(a.effet, "")
    return {
        "effet": a.effet, "duree": a.duree,
        "fond": "/media/fond.mp4" if fond else None,
        "detoure": "/media/detoure.webm" if detoure else None,
        "avant": "/media/avant.mp4" if avant else None,
        "images": images, "texte": texte,
        "haut": a.haut if a.haut is not None else ("À faire" if a.effet == "todo-list" else DEFAUTS["haut"]),
        "mot": a.mot or DEFAUTS["mot"].get(a.effet, "PROMPT"),
        "mots": (a.mots or (DEFAUTS["todo"] if a.effet == "todo-list" else DEFAUTS["mots"])).split("|"),
        "legendes": (a.legendes or DEFAUTS["legendes"]).split("|"), "couleur": a.couleur,
    }


def verifier(a: argparse.Namespace) -> None:
    if not a.video and a.effet not in VIDEO_FACULTATIVE:
        raise SystemExit(f"{a.effet} a besoin d'une vidéo : --video ma-video.mp4")
    if a.effet == "carrousel-3d" and len(a.images or []) < 3:
        raise SystemExit("carrousel-3d a besoin d'au moins 3 images : --images a.jpg b.jpg c.jpg")
    for f in [a.video, a.avant, *(a.images or [])]:
        if f and not Path(f).expanduser().is_file():
            raise SystemExit(f"Fichier introuvable : {f}")
    if a.video:
        dispo = duree_video(Path(a.video).expanduser()) - a.debut
        if dispo < 1.5:
            raise SystemExit(f"La vidéo est trop courte après --debut {a.debut} : {dispo:.1f} s (1,5 s minimum).")
        a.duree = min(a.duree, round(dispo - 0.1, 2))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("effet", choices=["installer", "carrousel-3d", "papier-decoupe", "texte-derriere", "ecran-led", "doodle", "avant-apres",
                                      "clones", "vhs", "neon", "mosaique", "bd", "mise-en-abyme", "todo-list"])
    ap.add_argument("--video", help="ta vidéo (n'importe quel format, recadrée en 9:16)")
    ap.add_argument("--avant", help="avant-apres : vraie vidéo « avant » (sinon l'avant est simulé)")
    ap.add_argument("--images", nargs="+", help="carrousel-3d : 3 à 8 images (captures, couvertures)")
    ap.add_argument("--texte", help="texte de l'effet : lettres découpées, texte manuscrit, néon, bulle de BD, date VHS, étiquette des clones, sous-titre de la mosaïque")
    ap.add_argument("--haut", help="texte-derriere : petite ligne au-dessus du mot (\"\" pour aucune)")
    ap.add_argument("--mot", help="texte-derriere et mosaique : le mot géant ; bd : l'onomatopée")
    ap.add_argument("--mots", help="ecran-led : mots séparés par | ; todo-list : lignes séparées par |, « - » devant une ligne pour la barrer")
    ap.add_argument("--legendes", help="avant-apres : 2 sous-titres séparés par |")
    ap.add_argument("--couleur", default="#d97757", help="couleur d'accent (texte-derriere, fond de la mosaique)")
    ap.add_argument("--debut", type=float, default=0.0, help="secondes à sauter au début de ta vidéo")
    ap.add_argument("--duree", type=float, default=3.5, help="durée du clip en secondes")
    ap.add_argument("--detourage", choices=list(MODELES), default="rapide", help="fin : plus précis (cheveux), environ 15 fois plus lent")
    ap.add_argument("--rapide", action="store_true", help="aperçu sans flou de mouvement (4 fois plus rapide)")
    ap.add_argument("--sortie", help="fichier .mp4 de sortie")
    a = ap.parse_args()
    if a.effet == "installer":
        return installer()
    verifier(a)

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    sortie = Path(a.sortie).expanduser() if a.sortie else Path("effets-sortie") / f"{a.effet}-{stamp}.mp4"
    sortie.parent.mkdir(parents=True, exist_ok=True)
    travail = Path(".effets") / f"{a.effet}-{stamp}"
    media = travail / "media"; media.mkdir(parents=True)

    fond = detoure = avant = False
    if a.video:
        src = Path(a.video).expanduser().resolve()
        cle = hashlib.sha1(f"{src}|{src.stat().st_mtime}|{a.debut}|{a.duree}|{a.detourage}".encode()).hexdigest()[:12]
        cache = Path(".effets") / "cache" / cle; cache.mkdir(parents=True, exist_ok=True)
        if not (cache / "fond.mp4").exists():
            print("Préparation de la vidéo…", flush=True)
            preparer(src, cache / "fond.mp4", a.debut, a.duree)
        if a.effet in DETOURE and not (cache / "detoure.webm").exists():
            print(f"Détourage ({MODELES[a.detourage]}, sur ta machine)…", flush=True)
            detourer(cache / "fond.mp4", cache / "detoure.webm", MODELES[a.detourage], travail)
        shutil.copy(cache / "fond.mp4", media / "fond.mp4"); fond = True
        if a.effet in DETOURE:
            shutil.copy(cache / "detoure.webm", media / "detoure.webm"); detoure = True
    if a.avant:
        preparer(Path(a.avant).expanduser(), media / "avant.mp4", a.debut, a.duree); avant = True
    images = preparer_images([Path(i).expanduser() for i in a.images or []], media)
    (media / "config.json").write_text(json.dumps(config(a, fond, detoure, avant, images), ensure_ascii=False))

    srv = serveur(media)
    sub = 1 if a.rapide else 4
    images_dir = travail / "sub"; images_dir.mkdir()
    print(f"Rendu de {a.effet} ({a.duree:.1f} s, {sub} sous-image(s) par image)…", flush=True)
    asyncio.run(rendre(f"http://127.0.0.1:{srv.server_address[1]}/effet.html?c=/media/config.json", a.duree, sub, images_dir))
    srv.shutdown()
    encoder(images_dir, sub, media / "fond.mp4" if fond else None, sortie)
    shutil.rmtree(travail)
    print(f"OK -> {sortie.resolve()}")
    print(f"planche -> {sortie.with_name(sortie.stem + '-planche.jpg').resolve()}")


if __name__ == "__main__":
    main()
