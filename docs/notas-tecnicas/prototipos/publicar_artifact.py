"""Gera as cópias publicáveis (Artifact) dos protótipos NT-001, sem mexer nos originais."""
import os, re, shutil, urllib.request

# Uso: python publicar_artifact.py  (gera .artifact-build/v1 e v2; publique cada index.html com a pasta como root)
PROTO = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(PROTO, '.artifact-build')
PH = os.path.join(OUT, '_phosphor')
os.makedirs(PH, exist_ok=True)
for v in ('regular', 'fill'):
    if not os.path.exists(os.path.join(PH, v + '.css')):
        urllib.request.urlretrieve(f'https://unpkg.com/@phosphor-icons/web@2.1.2/src/{v}/style.css', os.path.join(PH, v + '.css'))

# fontes do Phosphor (só woff2)
for name in ('Phosphor', 'Phosphor-Fill'):
    dst = os.path.join(PH, name + '.woff2')
    if not os.path.exists(dst):
        sub = 'regular' if name == 'Phosphor' else 'fill'
        urllib.request.urlretrieve(f'https://unpkg.com/@phosphor-icons/web@2.1.2/src/{sub}/{name}.woff2', dst)
for v in ('regular', 'fill'):
    css = open(os.path.join(PH, v + '.css'), encoding='utf-8').read()
    css = re.sub(r'src:\s*url\("\./([\w-]+)\.woff2"\)[^;]*;', r'src: url("./\1.woff2") format("woff2");', css)
    open(os.path.join(PH, v + '.min.css'), 'w', encoding='utf-8').write(css)


def adapt(src, title):
    s = open(os.path.join(PROTO, src), encoding='utf-8').read()
    s = re.sub(r'<!doctype html>\s*', '', s, flags=re.I)
    s = re.sub(r'<html[^>]*>\s*', '', s)
    s = s.replace('</html>', '')
    s = s.replace('<head>\n', '').replace('</head>\n', '')
    s = s.replace('<meta charset="utf-8">\n', '').replace('<meta name="viewport" content="width=device-width, initial-scale=1">\n', '')
    s = re.sub(r'<title>[^<]*</title>', f'<title>{title}</title>', s, count=1)
    # título no topo do arquivo
    s = re.sub(r'<title>[^<]*</title>\n', '', s, count=1)
    s = f'<title>{title}</title>\n' + s
    # ícones: CSS próprio publicado junto
    s = s.replace('https://unpkg.com/@phosphor-icons/web@2.1.2/src/regular/style.css', 'phosphor/regular.min.css')
    s = s.replace('https://unpkg.com/@phosphor-icons/web@2.1.2/src/fill/style.css', 'phosphor/fill.min.css')
    s = s.replace('<link rel="preconnect" href="https://unpkg.com">\n', '')
    # body vira um invólucro
    s = re.sub(r'<body([^>]*)>', r'<div id="app"\1>', s, count=1)
    s = s.replace('</body>', '</div>')
    # tema: respeita o data-theme do visualizador
    s = s.replace("if (mm('(prefers-color-scheme: dark)')) h.classList.add('dark');",
                  "var t = h.getAttribute('data-theme'); if (t === 'dark' || (!t && mm('(prefers-color-scheme: dark)'))) h.classList.add('dark');")
    s = s.replace("h.classList.toggle('dark', dark);",
                  "h.classList.toggle('dark', dark); if (p.tema === 'sistema') h.removeAttribute('data-theme'); else h.setAttribute('data-theme', dark ? 'dark' : 'light');")
    m = re.search(r'  \.dark \{\n(.*?)\n  \}', s, flags=re.S)
    if m:
        body = m.group(1)
        guard = ('  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {\n' + body + '\n  } }\n'
                 '  :root[data-theme="dark"] {\n' + body + '\n  }\n')
        s = s.replace(m.group(0), m.group(0) + '\n' + guard, 1)
    # barras fixas respeitam as áreas seguras do celular
    s = s.replace('<header class="sticky top-0 z-40', '<header class="sticky top-[env(safe-area-inset-top,0px)] z-40', 1)
    s = s.replace('fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 p-3', 'fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))]', 1)
    return s


for folder, src, title in (('v2', 'NT-001-landing-page-v2.html', 'Landing JornadaPet'),
                           ('v1', 'NT-001-landing-page.html', 'Landing JornadaPet v1')):
    d = os.path.join(OUT, folder)
    if os.path.exists(d):
        shutil.rmtree(d)
    os.makedirs(os.path.join(d, 'phosphor'))
    html = adapt(src, title)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html)
    shutil.copytree(os.path.join(PROTO, 'NT-001-assets'), os.path.join(d, 'NT-001-assets'))
    marca = sorted(set(re.findall(r'NT-002-assets/png/([\w.-]+)', html)))
    if marca:
        os.makedirs(os.path.join(d, 'NT-002-assets', 'png'))
        for f in marca:
            shutil.copy(os.path.join(PROTO, 'NT-002-assets', 'png', f), os.path.join(d, 'NT-002-assets', 'png', f))
    for f in ('regular.min.css', 'fill.min.css', 'Phosphor.woff2', 'Phosphor-Fill.woff2'):
        shutil.copy(os.path.join(PH, f), os.path.join(d, 'phosphor', f))
    used = set(re.findall(r'NT-001-assets/([\w.-]+)', html)) | set(re.findall(r"'NT-001-assets/'\+t\.img\+'\.jpg'", html) and ['passeador.jpg', 'creche.jpg', 'banho-tosa.jpg', 'veterinario.jpg'])
    for f in os.listdir(os.path.join(d, 'NT-001-assets')):
        if f not in used:
            os.remove(os.path.join(d, 'NT-001-assets', f))
    print(folder, len(html), sorted(os.listdir(os.path.join(d, 'NT-001-assets'))),
          'restos:', re.findall(r'<!doctype|<html|<head>|<body|unpkg\.com', html, flags=re.I))
