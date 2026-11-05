# /// script
# requires-python = ">=3.10"
# dependencies = ["faster-whisper>=1.0"]
# ///
"""Transforme une longue vidéo de jeu en shorts verticaux (1080 × 1920) prêts pour YouTube Shorts, TikTok ou les Reels.

    uv run clipping.py analyser ma-partie.mp4 [--n 8] [--duree 30]
    uv run clipping.py rendre ma-partie.mp4 clips-ma-partie/choix.json
    uv run clipping.py rendre ma-partie.mp4 --auto [--n 8]        (sans relecture : les meilleurs moments tels quels)

analyser : mesure le volume toutes les 0,5 s, l'action à l'image (différence entre images) et les changements de plan
(filtre scdet de ffmpeg), transcrit la voix (faster-whisper, modèle small, langue détectée), puis note chaque fenêtre
de --duree secondes et garde les meilleures sans chevauchement. Écrit clips-<nom>/analyse.json.
rendre : pour chaque moment de choix.json (debut, fin, bandeau, titre, description, hashtags), la vidéo d'origine au
centre sur un fond flou d'elle-même, un bandeau de titre en haut, des sous-titres mot à mot (2-3 mots) au tiers bas,
son à −14 LUFS. Écrit short-01.mp4…, clips.md et planche.jpg dans clips-<nom>/.
Besoin : ffmpeg (avec libass) dans le PATH."""
from __future__ import annotations

import argparse, json, re, shutil, statistics, subprocess, sys, time
from pathlib import Path

W, H, FPS = 1080, 1920, 30
PAS = 0.5  # secondes par mesure de volume


def ff(*args: str, cwd: Path | None = None) -> str:
    exe = shutil.which("ffmpeg")
    if not exe:
        sys.exit("ffmpeg introuvable : installe-le (brew install ffmpeg, winget install ffmpeg, sudo apt install ffmpeg)")
    r = subprocess.run([exe, "-hide_banner", "-nostdin", *args], capture_output=True, text=True, cwd=cwd)
    if r.returncode != 0:
        sys.exit(f"ffmpeg a échoué :\n{r.stderr[-1500:]}")
    return r.stdout + r.stderr


def duree_de(video: Path) -> tuple[float, bool]:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", str(video)],
                         capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    return float(d["format"]["duration"]), any(s["codec_type"] == "audio" for s in d.get("streams", []))


def volume(video: Path) -> list[float]:
    """Niveau RMS (dB) toutes les PAS secondes."""
    out = ff("-i", str(video), "-vn", "-af", f"aresample=44100,asetnsamples=n={int(44100 * PAS)}:p=0,astats=metadata=1:reset=1,"
             "ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-", "-f", "null", "-")
    vals = [float(v) if v not in ("-inf", "inf", "nan") else -90.0 for v in re.findall(r"RMS_level=(\S+)", out)]
    return vals


def images(video: Path) -> tuple[dict[int, list[float]], list[float]]:
    """Action par seconde (score de différence entre images) et instants des changements de plan."""
    out = ff("-i", str(video), "-an", "-vf", "fps=10,scale=320:-2,scdet=threshold=12,metadata=print:file=-", "-f", "null", "-")
    action: dict[int, list[float]] = {}
    coupes: list[float] = []
    t = 0.0
    for ligne in out.splitlines():
        m = re.search(r"pts_time:([\d.]+)", ligne)
        if m:
            t = float(m.group(1))
        m = re.search(r"lavfi\.scd\.score=([\d.]+)", ligne)
        if m:
            action.setdefault(int(t), []).append(float(m.group(1)))
        m = re.search(r"lavfi\.scd\.time=([\d.]+)", ligne)
        if m:
            coupes.append(float(m.group(1)))
    return action, coupes


def transcrire(video: Path, avec_son: bool) -> tuple[str, list[dict]]:
    if not avec_son:
        return "-", []
    import numpy as np
    from faster_whisper import WhisperModel
    # Audio décodé par ffmpeg (16 kHz mono) : évite PyAV, dont certaines versions cassent faster-whisper.
    brut = subprocess.run([shutil.which("ffmpeg") or "ffmpeg", "-v", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                          capture_output=True, check=True).stdout
    audio = np.frombuffer(brut, dtype=np.float32)
    modele = WhisperModel("small", device="cpu", compute_type="int8")
    segments, info = modele.transcribe(audio, word_timestamps=True, vad_filter=True)
    mots = [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for s in segments for w in (s.words or []) if w.word.strip()]
    return info.language, mots


def normer(vals: list[float]) -> list[float]:
    if not vals:
        return []
    bas, haut = sorted(vals)[int(len(vals) * 0.1)], sorted(vals)[int(len(vals) * 0.95) - 1 if len(vals) > 1 else 0]
    return [min(1.0, max(0.0, (v - bas) / (haut - bas))) if haut > bas else 0.5 for v in vals]


def analyser(video: Path, n: int, duree: float) -> Path:
    t0 = time.time()
    total, avec_son = duree_de(video)
    dossier = video.parent / f"clips-{video.stem}"
    dossier.mkdir(exist_ok=True)
    print(f"vidéo : {video.name}, {total:.0f} s, son : {'oui' if avec_son else 'non'}")
    print("1/3 volume…", flush=True)
    vol = normer(volume(video)) if avec_son else []
    print("2/3 action à l'image et changements de plan…", flush=True)
    action_s, coupes = images(video)
    secondes = int(total)
    action = normer([statistics.mean(action_s.get(s, [0.0])) for s in range(secondes)])
    print("3/3 transcription (faster-whisper small)…", flush=True)
    langue, mots = transcrire(video, avec_son)
    parole = [0.0] * secondes
    for m in mots:
        if int(m["s"]) < secondes:
            parole[int(m["s"])] += 1

    duree = min(duree, max(10.0, total / max(1, n) - 1))
    candidats = []
    t = 0.0
    while t + duree <= total:
        a, b = int(t / PAS), int((t + duree) / PAS)
        v = vol[a:b] or [0.0]
        moy, pic = statistics.mean(v), max(v)
        act = statistics.mean(action[int(t):int(t + duree)] or [0.0])
        nb_coupes = sum(1 for c in coupes if t <= c < t + duree)
        debit = sum(parole[int(t):int(t + duree)]) / duree
        score = 0.35 * moy + 0.2 * pic + 0.3 * act + 0.05 * min(1, nb_coupes / 4) + 0.1 * min(1, debit / 2.5)
        pic_t = t + (v.index(pic) * PAS if vol else 0)
        candidats.append({"debut": round(t, 1), "fin": round(t + duree, 1), "score": round(score, 3), "volume": round(moy, 2),
                          "pic_volume_a": round(pic_t, 1), "action": round(act, 2), "changements_de_plan": nb_coupes})
        t += 1.0
    candidats.sort(key=lambda c: c["score"], reverse=True)
    retenus: list[dict] = []
    for c in candidats:
        if all(c["fin"] + 1 <= r["debut"] or c["debut"] >= r["fin"] + 1 for r in retenus):
            retenus.append(c)
        if len(retenus) >= 2 * n:
            break
    for i, c in enumerate(retenus, 1):
        c["id"] = i
        c["paroles"] = " ".join(m["w"] for m in mots if c["debut"] <= m["s"] < c["fin"])
    analyse = {"video": str(video.resolve()), "duree": round(total, 1), "langue": langue, "duree_clip": duree,
               "candidats": retenus, "mots": mots}
    sortie = dossier / "analyse.json"
    sortie.write_text(json.dumps(analyse, ensure_ascii=False, indent=1))
    print(f"\n{len(retenus)} moments candidats ({duree:.0f} s chacun), du meilleur au moins bon :")
    for c in retenus:
        print(f"  #{c['id']:<2} {c['debut']:>6.1f}-{c['fin']:<6.1f} score {c['score']:.2f} | volume {c['volume']:.2f} | action {c['action']:.2f}"
              f" | {c['changements_de_plan']} plans | {c['paroles'][:70] or '(pas de voix)'}")
    if len(retenus) < n:
        print(f"\nattention : la vidéo ne permet que {len(retenus)} moments de {duree:.0f} s sans chevauchement")
    print(f"\n-> {sortie} ({time.time() - t0:.0f} s)")
    return sortie


def ass_temps(s: float) -> str:
    return f"{int(s // 3600)}:{int(s % 3600 // 60):02d}:{s % 60:05.2f}"


def ecrire_ass(chemin: Path, bandeau: str, mots: list[dict], debut: float, fin: float) -> None:
    lignes = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "WrapStyle: 0", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut,"
        " ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        "Style: Mots,Arial Black,96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,8,0,2,60,60,560,1",
        "Style: Bandeau,Arial Black,64,&H00FFFFFF,&H00FFFFFF,&H00000000,&HC0101010,-1,0,0,0,100,100,0,0,3,18,0,8,60,60,210,1",
        "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    if bandeau:
        lignes.append(f"Dialogue: 1,{ass_temps(0)},{ass_temps(fin - debut)},Bandeau,,0,0,0,,{bandeau.upper()}")
    dedans = [m for m in mots if debut <= m["s"] < fin]
    i = 0
    while i < len(dedans):
        # Paquets de 3 mots, ou 2 si les 3 font une ligne trop longue.
        paquet = dedans[i:i + 3]
        if len(paquet) == 3 and len(" ".join(m["w"] for m in paquet)) > 18:
            paquet = paquet[:2]
        i += len(paquet)
        a = paquet[0]["s"] - debut
        suivant = dedans[i]["s"] - debut if i < len(dedans) else paquet[-1]["e"] - debut + 0.3
        b = min(suivant, paquet[-1]["e"] - debut + 0.6)
        texte = " ".join(m["w"] for m in paquet).upper().replace("{", "").replace("}", "")
        lignes.append(f"Dialogue: 0,{ass_temps(max(0, a))},{ass_temps(max(a + 0.2, b))},Mots,,0,0,0,,{{\\fscx110\\fscy110\\t(0,90,\\fscx100\\fscy100)}}{texte}")
    chemin.write_text("\n".join(lignes) + "\n", encoding="utf-8")


def rendre(video: Path, choix: list[dict], dossier: Path, mots: list[dict]) -> None:
    t0 = time.time()
    _, avec_son = duree_de(video)
    vignettes = []
    for i, c in enumerate(choix, 1):
        nom = f"short-{i:02d}"
        ass = dossier / f"{nom}.ass"
        ecrire_ass(ass, c.get("bandeau", ""), mots, c["debut"], c["fin"])
        graphe = (f"[0:v]fps={FPS},split[a][b];"
                  f"[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},gblur=sigma=28,eq=brightness=-0.18[fond];"
                  f"[b]scale={W}:{H}:force_original_aspect_ratio=decrease[avant];"
                  f"[fond][avant]overlay=(W-w)/2:(H-h)/2,ass={ass.name},format=yuv420p[v]")
        args = ["-y", "-ss", str(c["debut"]), "-t", str(c["fin"] - c["debut"]), "-i", str(video.resolve()), "-filter_complex", graphe, "-map", "[v]"]
        if avec_son:
            args += ["-map", "0:a:0", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "160k", "-ar", "48000"]
        args += ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-movflags", "+faststart", f"{nom}.mp4"]
        ff(*args, cwd=dossier)
        ass.unlink()
        img = dossier / f"{nom}.jpg"
        ff("-y", "-ss", str((c["fin"] - c["debut"]) / 2), "-i", f"{nom}.mp4", "-frames:v", "1", "-vf", "scale=360:-2", img.name, cwd=dossier)
        vignettes.append(img)
        print(f"  {nom}.mp4  {c['debut']:.1f}-{c['fin']:.1f}  {c.get('bandeau', '')}", flush=True)
    cols = min(5, len(vignettes))
    entrees = [a for v in vignettes for a in ("-i", v.name)]
    disposition = "|".join(f"{(k % cols) * 360}_{(k // cols) * 640}" for k in range(len(vignettes)))
    if len(vignettes) > 1:
        ff("-y", *entrees, "-filter_complex", f"xstack=inputs={len(vignettes)}:layout={disposition}:fill=black", "-frames:v", "1", "planche.jpg", cwd=dossier)
    else:
        shutil.copy(vignettes[0], dossier / "planche.jpg")
    for v in vignettes:
        v.unlink()
    md = [f"# Shorts de {video.name}", ""]
    for i, c in enumerate(choix, 1):
        md += [f"## short-{i:02d}.mp4 ({c['debut']:.0f} s → {c['fin']:.0f} s)", "",
               f"**Titre :** {c.get('titre', '(à écrire)')}", "", f"**Description :** {c.get('description', '(à écrire)')}", "",
               f"**Hashtags :** {c.get('hashtags', '#shorts #gaming')}", ""]
    (dossier / "clips.md").write_text("\n".join(md), encoding="utf-8")
    print(f"\n{len(choix)} shorts -> {dossier}/ (short-01.mp4…, clips.md, planche.jpg) en {time.time() - t0:.0f} s")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("etape", choices=["analyser", "rendre"])
    p.add_argument("video", type=Path)
    p.add_argument("choix", type=Path, nargs="?", help="choix.json (étape rendre)")
    p.add_argument("--n", type=int, default=8, help="nombre de shorts voulus (5 à 10)")
    p.add_argument("--duree", type=float, default=30, help="durée d'un short en secondes (20 à 45)")
    p.add_argument("--auto", action="store_true", help="rendre les n meilleurs moments sans relecture")
    a = p.parse_args()
    if not a.video.exists():
        sys.exit(f"vidéo introuvable : {a.video}")
    if a.etape == "analyser":
        analyser(a.video, a.n, a.duree)
        return
    dossier = a.video.parent / f"clips-{a.video.stem}"
    analyse_json = dossier / "analyse.json"
    if not analyse_json.exists():
        analyser(a.video, a.n, a.duree)
    analyse = json.loads(analyse_json.read_text())
    if a.auto:
        choix = [{"debut": c["debut"], "fin": c["fin"], "bandeau": f"Moment {i}"} for i, c in enumerate(analyse["candidats"][:a.n], 1)]
        choix.sort(key=lambda c: c["debut"])
    else:
        if not a.choix or not a.choix.exists():
            sys.exit("donne le fichier choix.json écrit après l'analyse, ou --auto")
        choix = json.loads(a.choix.read_text())
    rendre(a.video, choix, dossier, analyse["mots"])


if __name__ == "__main__":
    main()
