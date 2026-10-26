# /// script
# requires-python = ">=3.10"
# dependencies = ["fal-client>=0.5", "imageio-ffmpeg>=0.5", "pillow>=10.1"]
# ///
"""Tu parles face caméra… et au milieu de ta phrase, tu deviens quelqu'un d'autre qui la termine avec tes gestes.

    uv run transfo.py ma-video.mp4 --personne "coach sportive, la trentaine" --devis
    uv run transfo.py ma-video.mp4 --personne "coach sportive, la trentaine" --oui

Étapes (via fal.ai, clé FAL_KEY) :
  1. la vidéo est recadrée en 9:16 ; la bascule est placée sur la première pause après 1,5 s (ou --bascule) ;
  2. Nano Banana Pro crée la nouvelle personne à partir d'une image de ta vidéo (même pose, même pièce, même objet) ;
  3. Kling 2.6 Motion Control lui fait rejouer tes gestes, ton visage et ta bouche, de la bascule à la fin ;
  4. ElevenLabs (voice changer) transforme ta voix en gardant tes mots et ton rythme ;
  5. montage : toi jusqu'à la bascule, flash blanc, l'autre personne ensuite, mention « Vidéo générée par IA ».
Chaque résultat payant est gardé dans .transfo/<vidéo>/ : relancer ne repaie pas une étape déjà faite."""
from __future__ import annotations

import argparse, hashlib, json, os, re, subprocess, urllib.request
from pathlib import Path

import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
AVANT = 0.5  # secondes envoyées à Kling avant la bascule, pour que le mouvement soit lancé au moment de la coupe
PRIX = {"image": 0.15, "standard": 0.07, "pro": 0.112, "voix_min": 0.30}
MODELES = {
    "image": "fal-ai/nano-banana-pro/edit",
    "standard": "fal-ai/kling-video/v2.6/standard/motion-control",
    "pro": "fal-ai/kling-video/v2.6/pro/motion-control",
    "voix": "fal-ai/elevenlabs/voice-changer",
}
CONSIGNE_IMAGE = (
    "Edit this photo: replace the person with a different, fictional person: {personne}. "
    "Keep exactly the same pose, the same hand positions, the same object in hand, the same framing, "
    "the same room, the same lighting and colors. Photorealistic photo, natural skin texture, no text."
)


def ff(*args: str) -> None:
    subprocess.run([FF, "-v", "error", "-y", *args], check=True)


def duree(path: Path) -> float:
    return float(imageio_ffmpeg.count_frames_and_secs(str(path))[1] or 0)


def a_du_son(path: Path) -> bool:
    return "Audio:" in subprocess.run([FF, "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr


def premiere_pause(audio_de: Path, apres: float) -> float | None:
    """Milieu de la première pause (≥ 0,2 s sous −32 dB) qui commence après `apres` secondes."""
    out = subprocess.run([FF, "-hide_banner", "-i", str(audio_de), "-af", "silencedetect=noise=-32dB:d=0.2", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    debuts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    fins = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    for d, f in zip(debuts, fins):
        if d >= apres:
            return round((d + f) / 2, 2)
    return None


def telecharger(url: str, dest: Path) -> Path:
    urllib.request.urlretrieve(url, dest)
    return dest


def fal(modele: str, arguments: dict) -> dict:
    import fal_client

    print(f"fal : {modele}…", flush=True)
    return fal_client.subscribe(modele, arguments=arguments)


def envoyer(path: Path) -> str:
    import fal_client

    return fal_client.upload_file(path)


def etiquette(dest: Path, texte: str) -> Path:
    """Pastille « Vidéo générée par IA » (PNG transparent) posée en haut de la partie transformée."""
    from PIL import Image, ImageDraw, ImageFont

    font = ImageFont.truetype(str(Path(__file__).parent / "police" / "Geist.ttf"), 38)
    font.set_variation_by_axes([600])
    l, t, r, b = font.getbbox(texte)
    w, h = int(r - l) + 56, int(b - t) + 30
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=h // 2, fill=(0, 0, 0, 150))
    d.text((28 - l, 15 - t), texte, font=font, fill=(255, 255, 255, 235))
    im.save(dest)
    return dest


def monter(a: argparse.Namespace, dossier: Path, video: Path, kling: Path, voix: Path | None, bascule: float, sortie: Path) -> None:
    fin = duree(kling) - AVANT
    lab = etiquette(dossier / "etiquette.png", a.etiquette)
    # Partie B : la voix transformée (ou ta voix d'origine), calée sur la durée de la vidéo Kling.
    source_b = f"[3:a]atrim=start={AVANT}" if voix else f"[0:a]atrim=start={bascule}"
    son_b = f"{source_b},asetpts=PTS-STARTPTS,apad,atrim=0:{fin:.3f}[sb];"
    entrees = ["-i", str(video), "-i", str(kling), "-i", str(lab)] + (["-i", str(voix)] if voix else [])
    graphe = (
        f"[0:v]trim=0:{bascule},setpts=PTS-STARTPTS,fps={FPS}[va];"
        f"[1:v]trim=start={AVANT}:end={AVANT + fin},setpts=PTS-STARTPTS,scale={W}:{H}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H},fps={FPS},fade=t=in:st=0:d=0.22:color=white[vb0];"
        f"[vb0][2:v]overlay=(W-w)/2:70[vb];"
        f"[0:a]atrim=0:{bascule},asetpts=PTS-STARTPTS[sa];{son_b}"
        f"[va][sa][vb][sb]concat=n=2:v=1:a=1[v][s]"
    )
    ff(*entrees, "-filter_complex", graphe, "-map", "[v]", "-map", "[s]", "-c:v", "libx264", "-crf", "17", "-preset", "slow",
       "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(sortie))
    n = int(duree(sortie) * FPS)
    ff("-i", str(sortie), "-vf", f"select='not(mod(n\\,{max(1, n // 6)}))',scale=270:-1,tile=6x1", "-frames:v", "1",
       str(sortie.with_name(sortie.stem + "-planche.jpg")))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", help="ta vidéo face caméra qui parle (10 à 30 s)")
    ap.add_argument("--personne", required=True, help="qui tu deviens, en quelques mots (personne fictive uniquement)")
    ap.add_argument("--bascule", type=float, help="seconde de la bascule (sinon : première pause après 1,5 s)")
    ap.add_argument("--image-a", type=float, help="seconde de l'image qui sert de modèle (sinon : 1 s après la bascule)")
    ap.add_argument("--voix", default="Charlotte", help="voix ElevenLabs du voice changer (Charlotte, Alice, Laura, Lily…)")
    ap.add_argument("--sans-voix", action="store_true", help="garder ta voix telle quelle")
    ap.add_argument("--qualite", choices=["standard", "pro"], default="standard")
    ap.add_argument("--etiquette", default="Vidéo générée par IA")
    ap.add_argument("--devis", action="store_true", help="affiche le coût et s'arrête")
    ap.add_argument("--oui", action="store_true", help="accepte le coût affiché et lance les générations payantes")
    ap.add_argument("--sortie", help="fichier .mp4 de sortie")
    a = ap.parse_args()

    src = Path(a.video).expanduser().resolve()
    if not src.is_file():
        raise SystemExit(f"Vidéo introuvable : {src}")
    cle = hashlib.sha1(f"{src}|{src.stat().st_mtime}|{a.personne}|{a.qualite}".encode()).hexdigest()[:8]
    dossier = Path(".transfo") / f"{src.stem}-{cle}"; dossier.mkdir(parents=True, exist_ok=True)

    video = dossier / "video.mp4"
    if not video.exists():
        ff("-i", str(src), "-t", "30", "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},setsar=1",
           "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", str(video))
    if not a_du_son(video):
        raise SystemExit("La vidéo n'a pas de son : il faut une vidéo où tu parles.")
    total = duree(video)
    bascule = a.bascule if a.bascule is not None else premiere_pause(video, 1.5)
    if bascule is None or not 1.0 <= bascule <= total - 3:
        raise SystemExit(f"Bascule introuvable ou mal placée ({bascule}) : donne --bascule <secondes> (entre 1 et {total - 3:.1f}).")
    image_a = a.image_a if a.image_a is not None else min(total - 0.5, bascule + 1.0)
    part = round(total - bascule + AVANT, 2)
    cout = PRIX["image"] + PRIX[a.qualite] * part + (0 if a.sans_voix else PRIX["voix_min"] * part / 60)
    print(json.dumps({"duree_video": round(total, 2), "bascule": bascule, "image_modele_a": image_a,
                      "secondes_transformees": part, "cout_estime_usd": round(cout, 2)}, ensure_ascii=False))
    if a.devis or not a.oui:
        if not a.devis:
            print("Rien n'a été généré : relance avec --oui pour accepter ce coût.")
        return
    if not os.environ.get("FAL_KEY"):
        raise SystemExit("FAL_KEY manquante : crée une clé sur https://fal.ai/dashboard/keys puis export FAL_KEY=…")

    morceau = dossier / "morceau.mp4"
    ff("-ss", f"{bascule - AVANT:.3f}", "-i", str(video), "-t", f"{part:.3f}", "-vf", "scale=720:1280",
       "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", str(morceau))
    modele_img = dossier / "image-source.jpg"
    ff("-ss", f"{image_a:.3f}", "-i", str(video), "-frames:v", "1", "-q:v", "2", str(modele_img))

    personne = dossier / "personne.png"
    if not personne.exists():
        r = fal(MODELES["image"], {"prompt": CONSIGNE_IMAGE.format(personne=a.personne), "image_urls": [envoyer(modele_img)],
                                    "aspect_ratio": "9:16", "resolution": "2K", "num_images": 1, "output_format": "png"})
        telecharger(r["images"][0]["url"], personne)
    print(f"personne -> {personne.resolve()}")

    kling = dossier / f"kling-{a.qualite}.mp4"
    if not kling.exists():
        r = fal(MODELES[a.qualite], {"image_url": envoyer(personne), "video_url": envoyer(morceau),
                                      "character_orientation": "video", "keep_original_sound": False})
        telecharger(r["video"]["url"], kling)

    voix = None
    if not a.sans_voix:
        voix = dossier / f"voix-{a.voix}.mp3"
        if not voix.exists():
            son = dossier / "morceau.mp3"
            ff("-i", str(morceau), "-vn", "-c:a", "libmp3lame", "-b:a", "192k", str(son))
            r = fal(MODELES["voix"], {"audio_url": envoyer(son), "voice": a.voix, "output_format": "mp3_44100_128"})
            telecharger(r["audio"]["url"], voix)

    sortie = Path(a.sortie).expanduser() if a.sortie else Path("transfo-sortie") / f"{src.stem}-transfo.mp4"
    sortie.parent.mkdir(parents=True, exist_ok=True)
    monter(a, dossier, video, kling, voix, bascule, sortie)
    print(f"OK -> {sortie.resolve()}")
    print(f"planche -> {sortie.with_name(sortie.stem + '-planche.jpg').resolve()}")
    print(f"brut (personne, Kling, voix) -> {dossier.resolve()}")



if __name__ == "__main__":
    main()
