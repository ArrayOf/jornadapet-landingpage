"""Texto em Bricolage Grotesque convertido em curvas (SVG), em linha reta ou em arco."""
import math
import tempfile
import urllib.request
from functools import lru_cache
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


URL = "https://github.com/google/fonts/raw/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf"


@lru_cache(maxsize=None)
def fonte(peso):
    """Bricolage Grotesque (OFL), baixada uma vez para a pasta temporária."""
    arq = Path(tempfile.gettempdir()) / "BricolageGrotesque-var.ttf"
    if not arq.exists():
        urllib.request.urlretrieve(URL, arq)
    f = TTFont(str(arq))
    return instantiateVariableFont(f, {"wght": peso, "opsz": 96, "wdth": 100})


def _glifos(texto, peso):
    f = fonte(peso)
    cmap, gs, hmtx = f.getBestCmap(), f.getGlyphSet(), f["hmtx"]
    out = []
    for ch in texto:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(pen)
        out.append((pen.getCommands(), hmtx[g][0]))
    return out, f["head"].unitsPerEm


def reto(texto, x, y, tam, peso=800, cor="#23251f", espaco=0.0, ancora="middle"):
    """Linha de texto com a linha de base em y. espaco em em (letter-spacing)."""
    gl, upm = _glifos(texto, peso)
    s = tam / upm
    trk = espaco * upm
    total = sum(a for _, a in gl) + trk * (len(gl) - 1)
    x0 = x - total * s / 2 if ancora == "middle" else x
    partes, cur = [], 0
    for d, a in gl:
        if d:
            partes.append(f'<path d="{d}" transform="translate({x0 + cur * s:.2f} {y:.2f}) scale({s:.5f} {-s:.5f})"/>')
        cur += a + trk
    return f'<g fill="{cor}">' + "".join(partes) + "</g>"


def arco(texto, cx, cy, raio, tam, peso=800, cor="#3f5a2c", espaco=0.12, embaixo=False):
    """Texto centrado no topo (lido por fora) ou embaixo (lido de pé, por dentro do anel)."""
    gl, upm = _glifos(texto, peso)
    s = tam / upm
    trk = espaco * upm
    total = (sum(a for _, a in gl) + trk * (len(gl) - 1)) * s
    partes, cur = [], 0.0
    for d, a in gl:
        meio = cur + a * s / 2
        if embaixo:
            th = math.pi / 2 + (total / 2 - meio) / raio
            rot = math.degrees(th) - 90
        else:
            th = -math.pi / 2 + (meio - total / 2) / raio
            rot = math.degrees(th) + 90
        px, py = cx + raio * math.cos(th), cy + raio * math.sin(th)
        if d:
            partes.append(
                f'<path d="{d}" transform="translate({px:.2f} {py:.2f}) rotate({rot:.3f}) '
                f'scale({s:.5f} {-s:.5f}) translate({-a / 2:.1f} 0)"/>'
            )
        cur += (a + trk) * s
    return f'<g fill="{cor}">' + "".join(partes) + "</g>"
