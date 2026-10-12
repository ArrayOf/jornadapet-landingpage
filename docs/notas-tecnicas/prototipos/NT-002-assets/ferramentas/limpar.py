"""Limpeza dos logos da JornadaPet (NT-002): amplia, suaviza, encaixa na paleta exata e vetoriza.

Lê ../fontes/*.png (recortes da arte de referência) e grava ../svg/*.svg.
Dependências: pip install numpy pillow scipy vtracer fonttools
Uso: python limpar.py            (todas as peças)
     python limpar.py selos      (só uma etapa)
"""
import re
import sys
from pathlib import Path

import numpy as np
import vtracer
from PIL import Image, ImageDraw, ImageFilter

BASE = Path(__file__).resolve().parent.parent
WORK = BASE / "fontes"
OUT = BASE / "svg"
OUT.mkdir(exist_ok=True)
SCALE = 4
KEY = (255, 0, 255)  # cor-chave: vira transparente

# Paleta da marca (DESIGN.md + tons do mascote)
TINTA = (0x23, 0x25, 0x1F)
OLIVA = (0x3F, 0x5A, 0x2C)
SALVIA = (0xE1, 0xE7, 0xD6)
CARAMELO = (0xDB, 0xA0, 0x5A)
ORELHA = (0xC7, 0x85, 0x3F)
CREME = (0xF6, 0xE3, 0xC4)
LINGUA = (0xE9, 0x8A, 0x9A)
BRANCO = (0xFF, 0xFF, 0xFF)


def hexc(c):
    return "#%02x%02x%02x" % c


def snap(img_rgb, mapping):
    """mapping: lista de (cor de amostra, cor final). Cada pixel vai para a final da amostra mais próxima."""
    a = np.asarray(img_rgb, dtype=np.int32)
    samples = np.array([m[0] for m in mapping], dtype=np.int32)
    finals = np.array([m[1] for m in mapping], dtype=np.uint8)
    d = ((a[:, :, None, :] - samples[None, None, :, :]) ** 2).sum(-1)
    return Image.fromarray(finals[d.argmin(-1)], "RGB")


def prepare(img_rgba, mapping, bg=KEY, blur=2.2, mode=7):
    big = img_rgba.resize((img_rgba.width * SCALE, img_rgba.height * SCALE), Image.LANCZOS)
    base = Image.new("RGBA", big.size, bg + (255,))
    base.alpha_composite(big)
    rgb = base.convert("RGB").filter(ImageFilter.GaussianBlur(blur))
    q = snap(rgb, mapping)
    return q.filter(ImageFilter.ModeFilter(mode))


def trace_mask(mask, name):
    """Vetoriza uma máscara binária (True = pinta) e devolve os <path d> crus."""
    tmp = OUT / f"_{name}.png"
    Image.fromarray(np.where(mask, 0, 255).astype(np.uint8), "L").convert("RGB").save(tmp)
    svg_path = OUT / f"_{name}.raw.svg"
    vtracer.convert_image_to_svg_py(
        str(tmp), str(svg_path),
        colormode="binary", mode="spline",
        filter_speckle=30, corner_threshold=70, length_threshold=6.0,
        max_iterations=12, splice_threshold=50, path_precision=1,
    )
    raw = svg_path.read_text()
    tmp.unlink()
    svg_path.unlink()
    return re.findall(r'<path d="([^"]+)"[^>]*transform="translate\(([-\d.]+),([-\d.]+)\)"', raw)


def trace(img_rgb, name, order):
    """order: cores de baixo para cima. Cada camada é a união dela com todas as de cima,
    então não sobra fresta entre cores vizinhas."""
    a = np.asarray(img_rgb)
    masks = [np.all(a == np.array(c, np.uint8), -1) for c in order]
    out = []
    for k, c in enumerate(order):
        m = np.logical_or.reduce(masks[k:])
        for d, tx, ty in trace_mask(m, f"{name}-{k}"):
            out.append(f'<path d="{d}" fill="{hexc(c)}" transform="translate({tx},{ty})"/>')
    return "\n".join(out)


def cabeca_colorida():
    src = Image.open(WORK / "cabeca-colorida.png").convert("RGBA")
    a = np.asarray(src)
    rgb = a[..., :3].astype(int)
    vis = a[..., 3] > 128
    salvia_like = (rgb[..., 1] >= rgb[..., 0] - 2) & (rgb.min(-1) > 170)
    white = rgb.min(-1) > 238
    dog = vis & ~salvia_like & ~white
    # o disco de verdade é sálvia + cão (a borda branca fica de fora): centro = centróide, raio pela área
    disk = vis & ~white | dog
    ys, xs = np.nonzero(disk)
    cx, cy = xs.mean(), ys.mean()
    r = np.sqrt(disk.sum() / np.pi)
    # o peito foi recortado pelo disco: prolonga cada coluna do fundo do peito alguns px além da borda
    pad = 44
    full = np.zeros((a.shape[0] + pad, a.shape[1], 4), np.uint8)
    full[:a.shape[0]] = a
    for x in range(a.shape[1]):
        col = np.nonzero(dog[:, x])[0]
        if len(col) and col.max() > cy + r * 0.6:
            y0 = col.max() - 2
            full[y0:, x] = a[y0, x]
    # fundo sálvia e fora do círculo viram cor-chave
    fr = full[..., :3].astype(int)
    bgmask = (full[..., 3] < 128) | ((fr[..., 1] >= fr[..., 0] - 2) & (fr.min(-1) > 170))
    full[bgmask] = SALVIA + (255,)
    img = Image.fromarray(full, "RGBA")
    mapping = [
        (SALVIA, KEY),
        ((0x18, 0x18, 0x18), TINTA), ((0x24, 0x24, 0x18), TINTA), ((0x18, 0x24, 0x18), TINTA),
        ((0x3C, 0x54, 0x24), OLIVA), ((0x30, 0x48, 0x20), OLIVA),
        ((0xD8, 0x9C, 0x54), CARAMELO), ((0xD8, 0x9C, 0x60), CARAMELO),
        ((0xC0, 0x78, 0x3C), ORELHA), ((0xB4, 0x78, 0x30), ORELHA), ((0xB4, 0x78, 0x3C), ORELHA),
        ((0xF0, 0xE4, 0xC0), CREME), ((0xF0, 0xE4, 0xCC), CREME), ((0xF0, 0xD8, 0xC0), CREME),
        ((0xE8, 0x88, 0x98), LINGUA), ((0xE0, 0x80, 0x88), LINGUA), ((0xF0, 0xA0, 0xA8), LINGUA),
        ((0xFC, 0xFC, 0xFC), BRANCO),
    ]
    q = prepare(img, mapping, bg=SALVIA)
    body = trace(q, "cabeca-colorida", [CARAMELO, ORELHA, CREME, LINGUA, OLIVA, TINTA, BRANCO])
    W, H = q.size
    CX, CY, R = cx * SCALE, cy * SCALE, r * SCALE
    side = 2 * R
    vb = f"{CX - R:.0f} {CY - R:.0f} {side:.0f} {side:.0f}"
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="JornadaPet">
<title>JornadaPet</title>
<defs><clipPath id="c"><circle cx="{CX:.1f}" cy="{CY:.1f}" r="{R:.1f}"/></clipPath></defs>
<circle cx="{CX:.1f}" cy="{CY:.1f}" r="{R:.1f}" fill="{hexc(SALVIA)}"/>
<g clip-path="url(#c)">
{body}
</g>
</svg>
'''
    (OUT / "cabeca-colorida.svg").write_text(svg)
    # versão sem fundo (só o cão), para usar sobre outras cores
    print("cabeca-colorida ok", vb)





def _linha(src, erase_lines=(), keep_pink=True):
    """Desenho em traço: verde vira oliva exato, rosa vira língua, o resto vira transparente."""
    img = src.convert("RGBA")
    d = ImageDraw.Draw(img)
    for (x0, y0, x1, y1, w) in erase_lines:
        d.line([(x0, y0), (x1, y1)], fill=(0, 0, 0, 0), width=w)
    mapping = [
        ((255, 255, 255), KEY), ((0xF0, 0xE4, 0xC0), KEY), ((0xF0, 0xD8, 0xC0), KEY), ((0xFC, 0xE4, 0xCC), KEY),
        ((0x3C, 0x54, 0x24), OLIVA), ((0x30, 0x48, 0x18), OLIVA), ((0x24, 0x3C, 0x18), OLIVA), ((0x48, 0x60, 0x30), OLIVA),
        ((0xF0, 0xA8, 0xA0), LINGUA if keep_pink else KEY), ((0xE8, 0x90, 0x98), LINGUA if keep_pink else KEY),
        ((0xF0, 0xCC, 0xB4), LINGUA if keep_pink else KEY), ((0xE8, 0xB4, 0xA0), LINGUA if keep_pink else KEY),
    ]
    q = prepare(img, mapping, bg=(255, 255, 255), blur=1.8, mode=5)
    # rosa só onde é área de verdade (a língua); franjas finas de borda viram oliva
    from scipy import ndimage
    qa = np.asarray(q).copy()
    pink = np.all(qa == np.array(LINGUA, np.uint8), -1)
    # área de verdade = o que sobrevive a uma erosão (franja de borda é fina e some)
    solid = ndimage.binary_opening(pink, iterations=4)
    keep = ndimage.binary_dilation(solid, iterations=6) & pink
    qa[pink & ~keep] = OLIVA
    q = Image.fromarray(qa, "RGB")
    order = [LINGUA, OLIVA] if keep_pink else [OLIVA]
    a = np.asarray(q)
    ink = np.any([np.all(a == np.array(c, np.uint8), -1) for c in order], axis=0)
    ys, xs = np.nonzero(ink)
    return q, order, (xs.min(), ys.min(), xs.max(), ys.max())


def _svg(body, bbox, margin=24, label="JornadaPet"):
    x0, y0, x1, y1 = bbox
    vb = f"{x0 - margin} {y0 - margin} {x1 - x0 + 2 * margin} {y1 - y0 + 2 * margin}"
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="{label}">\n<title>{label}</title>\n{body}\n</svg>\n'


def cabeca_traco():
    src = Image.open(WORK / "cabeca-traco.png")
    # os dois riscos assimétricos da mancha do focinho (coordenadas do PNG original)
    erase = [(189, 110, 223, 150, 13), (136, 161, 167, 134, 13)]
    q, order, bbox = _linha(src, erase)
    (OUT / "cabeca-traco.svg").write_text(_svg(trace(q, "cabeca-traco", order), bbox))
    q2, order2, bbox2 = _linha(src, erase, keep_pink=False)
    (OUT / "cabeca-traco-uma-cor.svg").write_text(_svg(trace(q2, "cabeca-traco-1c", order2), bbox2))
    print("cabeca-traco ok")





def _inner(svg_text):
    """Conteúdo e viewBox de um SVG gerado aqui, para aninhar em outro."""
    vb = re.search(r'viewBox="([^"]+)"', svg_text).group(1)
    body = svg_text.split("</title>", 1)[1].rsplit("</svg>", 1)[0]
    return vb, body


def cao_sentado():
    src = Image.open(WORK / "selo-arco.png").convert("RGBA")
    crop = src.crop((60, 30, 270, 318))
    q, order, bbox = _linha(crop)
    # tira restos da moldura antiga: componentes que encostam na borda do recorte
    from scipy import ndimage
    a = np.asarray(q).copy()
    ink = ~np.all(a == np.array(KEY, np.uint8), -1)
    lab, n = ndimage.label(ink)
    borda = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    for k in borda:
        a[lab == k] = KEY
    q = Image.fromarray(a, "RGB")
    ys, xs = np.nonzero(~np.all(a == np.array(KEY, np.uint8), -1))
    bbox = (xs.min(), ys.min(), xs.max(), ys.max())
    (OUT / "cao-sentado-traco.svg").write_text(_svg(trace(q, "cao-sentado", order), bbox, margin=8))
    print("cao-sentado ok")


def selos():
    sys.path.insert(0, str(Path(__file__).parent))
    from fonte import arco, reto
    O = hexc(OLIVA)
    # ---------- selo redondo (traço oliva sobre transparente, e cheio oliva) ----------
    vb, cab = _inner((OUT / "cabeca-traco.svg").read_text())
    vb1, cab1 = _inner((OUT / "cabeca-traco-uma-cor.svg").read_text())
    C, R1, R2 = 240, 228, 158
    def redondo(cor, fundo, cabeca, cvb):
        bg = f'<circle cx="{C}" cy="{C}" r="{R1 + 4.5}" fill="{fundo}"/>' if fundo else ""
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" role="img" aria-label="JornadaPet, do adestrador">\n'
            f'<title>JornadaPet, do adestrador</title>\n{bg}'
            f'<circle cx="{C}" cy="{C}" r="{R1}" fill="none" stroke="{cor}" stroke-width="9"/>'
            f'<circle cx="{C}" cy="{C}" r="{R2}" fill="none" stroke="{cor}" stroke-width="6"/>'
            + arco("JORNADAPET", C, C, 178, 42, 800, cor, 0.10)
            + arco("DO ADESTRADOR", C, C, 211, 30, 700, cor, 0.14, embaixo=True)
            + f'<circle cx="{C - 193}" cy="{C}" r="6" fill="{cor}"/><circle cx="{C + 193}" cy="{C}" r="6" fill="{cor}"/>'
            + f'<svg x="{C - 128}" y="{C - 130}" width="256" height="256" viewBox="{cvb}">{cabeca}</svg>\n</svg>\n'
        )
    (OUT / "selo-redondo.svg").write_text(redondo(O, None, cab, vb))
    creme_cab = cab1.replace(f'fill="{O}"', f'fill="{hexc(CREME)}"')
    (OUT / "selo-redondo-oliva.svg").write_text(redondo(hexc(CREME), O, creme_cab, vb1))
    # ---------- selo em arco ----------
    vbd, cao = _inner((OUT / "cao-sentado-traco.svg").read_text())
    estrela = lambda x, y, r: (f'<path d="M{x} {y - r} C{x + r * .18} {y - r * .18} {x + r * .18} {y - r * .18} {x + r} {y} '
                               f'C{x + r * .18} {y + r * .18} {x + r * .18} {y + r * .18} {x} {y + r} '
                               f'C{x - r * .18} {y + r * .18} {x - r * .18} {y + r * .18} {x - r} {y} '
                               f'C{x - r * .18} {y - r * .18} {x - r * .18} {y - r * .18} {x} {y - r} Z" fill="{O}"/>')
    arco_svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480" role="img" aria-label="JornadaPet, do adestrador">\n'
        '<title>JornadaPet, do adestrador</title>\n'
        f'<path d="M14 466 V180 A166 166 0 0 1 346 180 V466 Z" fill="{hexc(CREME)}" stroke="{O}" stroke-width="9" stroke-linejoin="round"/>'
        + estrela(56, 210, 14) + estrela(304, 210, 14)
        + f'<svg x="72" y="46" width="216" height="280" viewBox="{vbd}">{cao}</svg>'
        + reto("JornadaPet", 180, 402, 62, 800, O, -0.02)
        + reto("DO ADESTRADOR", 180, 438, 21, 700, O, 0.16)
        + "\n</svg>\n"
    )
    (OUT / "selo-arco.svg").write_text(arco_svg)
    print("selos ok")


def logotipos():
    sys.path.insert(0, str(Path(__file__).parent))
    from fonte import reto
    vb, cab = _inner((OUT / "cabeca-colorida.svg").read_text())
    defs = cab  # contém o clipPath e o círculo
    for nome, cor in (("logotipo-horizontal", "#23251f"), ("logotipo-horizontal-escuro", "#f1f2ec")):
        (OUT / f"{nome}.svg").write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" role="img" aria-label="JornadaPet">\n<title>JornadaPet</title>\n'
            f'<svg x="0" y="0" width="160" height="160" viewBox="{vb}">{defs}</svg>'
            + reto("JornadaPet", 184, 108, 84, 800, cor, -0.035, ancora="start") + "\n</svg>\n")
    (OUT / "logotipo-empilhado.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 440" role="img" aria-label="JornadaPet">\n<title>JornadaPet</title>\n'
        f'<svg x="120" y="0" width="240" height="240" viewBox="{vb}">{defs}</svg>'
        + reto("JornadaPet", 240, 340, 84, 800, "#23251f", -0.035)
        + reto("Você cuida do cão. A gente lembra quem falta pagar.", 240, 396, 21, 600, "#3f5a2c", 0)
        + "\n</svg>\n")
    print("logotipos ok")





def quadrada():
    """Versão quadrada (fundo sálvia cheio) para ícones que o sistema arredonda sozinho (iOS, Android)."""
    s = (OUT / "cabeca-colorida.svg").read_text()
    m = re.search(r'<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"', s)
    cx, cy, r = map(float, m.groups())
    rect = f'<rect x="{cx - r:.1f}" y="{cy - r:.1f}" width="{2 * r:.1f}" height="{2 * r:.1f}"'
    s = re.sub(r'<clipPath id="c"><circle [^>]+/></clipPath>', f'<clipPath id="c">{rect}/></clipPath>', s)
    s = re.sub(r'<circle cx="[\d.]+" cy="[\d.]+" r="[\d.]+" fill="#e1e7d6"/>', f'{rect} fill="#e1e7d6"/>', s, count=1)
    (OUT / "cabeca-colorida-quadrada.svg").write_text(s)
    print("quadrada ok")


def nomes():
    sys.path.insert(0, str(Path(__file__).parent))
    from fonte import reto
    for nome, cor in (("nome", "#23251f"), ("nome-escuro", "#f1f2ec"), ("nome-oliva", "#3f5a2c")):
        (OUT / f"{nome}.svg").write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 100" role="img" aria-label="JornadaPet">\n<title>JornadaPet</title>\n'
            + reto("JornadaPet", 220, 74, 84, 800, cor, -0.035) + "\n</svg>\n")
    print("nomes ok")


if __name__ == "__main__":
    alvo = sys.argv[1:] or ["cabeca_colorida", "quadrada", "cabeca_traco", "cao_sentado", "selos", "logotipos", "nomes"]
    for nome in alvo:
        globals()[nome]()  # noqa
