#!/bin/sh
# Assemble la page autonome sigma52.html à partir de src/.
set -e
cd "$(dirname "$0")"
python3 - <<'PY'
t = open('src/template.html', encoding='utf-8').read()
for key, f in [('ENGINE', 'engine'), ('MATRIX', 'matrix'), ('SOLVER', 'solver'), ('CHARTS', 'charts'), ('COURSE', 'course'), ('COURSE1', 'course_l1'), ('COURSE2', 'course_l2'), ('COURSE3', 'course_l3'), ('COURSE4', 'course_l4'), ('SPOTS', 'spots'), ('BOARD', 'board'), ('HH', 'hh'), ('TABLE', 'table'), ('COACH', 'coach'), ('GUIDED', 'guided'), ('PLAN', 'plan'), ('APP', 'app'), ('APPSIM', 'app_sim')]:
    js = open(f'src/{f}.js', encoding='utf-8').read()
    assert '</script' not in js, f
    t = t.replace(f'/*__{key}__*/', js)
open('sigma52.html', 'w', encoding='utf-8').write(t)
print('sigma52.html', len(t.encode()), 'octets')
PY
