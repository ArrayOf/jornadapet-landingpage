#!/bin/sh
# Exporta os PNGs de cada canal (NT-002) com o Chrome headless.
# Uso, de dentro desta pasta: sh exportar.sh   (PY=caminho/do/python para trocar o interpretador)
cd "$(dirname "$0")"
PY="${PY:-python}"
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
D="$(cygpath -m "$PWD")"
mkdir -p ../png
shot() { # svg tamanho nome
  printf '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}img{display:block;width:%spx;height:%spx}</style><img src="../../svg/%s">' "$2" "$2" "$1" > comp/_s.html
  "$CH" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --default-background-color=00000000 --force-device-scale-factor=1 --window-size=$2,$2 --screenshot="$D/../png/$3" "file:///$D/comp/_s.html" 2>/dev/null
}
shot cabeca-colorida-quadrada.svg 640 avatar-telegram-whatsapp-640.png
shot cabeca-colorida-quadrada.svg 1080 avatar-instagram-1080.png
shot cabeca-colorida-quadrada.svg 180 apple-touch-icon-180.png
shot cabeca-colorida-quadrada.svg 192 icon-192.png
shot cabeca-colorida-quadrada.svg 512 icon-512.png
shot cabeca-colorida.svg 32 favicon-32.png
shot cabeca-colorida.svg 16 favicon-16.png
shot selo-redondo.svg 1080 selo-redondo-1080.png
shot selo-redondo-oliva.svg 1080 selo-redondo-oliva-1080.png
"$CH" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --force-device-scale-factor=1 --window-size=1200,630 --screenshot="$D/../png/og-1200x630.png" "file:///$D/comp/og.html" 2>/dev/null
"$CH" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --force-device-scale-factor=1 --virtual-time-budget=4000 --window-size=640,360 --screenshot="$D/../png/telegram-descricao-640x360.png" "file:///$D/comp/tg-descricao.html" 2>/dev/null
printf '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}img{display:block;width:810px;height:1080px}</style><img src="../../svg/selo-arco.svg">' > comp/_s.html
"$CH" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --default-background-color=00000000 --force-device-scale-factor=1 --window-size=810,1080 --screenshot="$D/../png/selo-arco-810x1080.png" "file:///$D/comp/_s.html" 2>/dev/null
rm -f comp/_s.html
# ícones e avatares que os apps recortam sozinhos: fundo sálvia opaco, sem transparência
"$PY" -c "
from PIL import Image
for f in ['avatar-telegram-whatsapp-640','avatar-instagram-1080','apple-touch-icon-180','icon-192','icon-512']:
    im=Image.open(f'../png/{f}.png').convert('RGBA'); bg=Image.new('RGBA',im.size,(0xe1,0xe7,0xd6,255)); bg.alpha_composite(im); bg.convert('RGB').save(f'../png/{f}.png')
"
