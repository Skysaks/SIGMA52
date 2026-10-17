#!/bin/sh
# Assemble la page autonome nuts.html à partir de src/.
set -e
cd "$(dirname "$0")"
python3 - <<'PY'
t = open('src/template.html', encoding='utf-8').read()
for key, f in [('ENGINE', 'engine'), ('CHARTS', 'charts'), ('COURSE', 'course'), ('SPOTS', 'spots'), ('APP', 'app')]:
    js = open(f'src/{f}.js', encoding='utf-8').read()
    assert '</script' not in js, f
    t = t.replace(f'/*__{key}__*/', js)
open('nuts.html', 'w', encoding='utf-8').write(t)
print('nuts.html', len(t.encode()), 'octets')
PY
