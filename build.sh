#!/bin/sh
# Assemble la page autonome sigma52.html à partir de src/.
set -e
cd "$(dirname "$0")"
python3 - <<'PY'
t = open('src/template.html', encoding='utf-8').read()
for key, f in [('ENGINE', 'engine'), ('OMAHA', 'omaha'), ('VARIANTS', 'variants'), ('MATRIX', 'matrix'), ('SOLVER', 'solver'), ('CHARTS', 'charts'), ('COURSE', 'course'), ('COURSE1', 'course_l1'), ('COURSE2', 'course_l2'), ('COURSE3', 'course_l3'), ('COURSE4', 'course_l4'), ('COURSEE', 'course_elite'), ('COURSEC', 'course_champions'), ('COURSEL', 'course_live'), ('COURSEX', 'course_extra'), ('COURSEU', 'course_ultimate'), ('COURSEP', 'course_paths'), ('COURSEM', 'course_more'), ('COURSED', 'course_deep'), ('COURSED2', 'course_deep2'), ('COURSED3', 'course_deep3'), ('COURSE360', 'course_360'), ('COURSE22', 'course_v22'), ('RUNOUT', 'runout'), ('EXAMS', 'exams'), ('SPOTS', 'spots'), ('BOARD', 'board'), ('HH', 'hh'), ('TABLE', 'table'), ('MTT', 'mtt'), ('COACH', 'coach'), ('GUIDED', 'guided'), ('PLAN', 'plan'), ('PRO', 'pro'), ('TRACKS', 'tracks'), ('FSRS', 'fsrs'), ('APP', 'app'), ('APPSIM', 'app_sim'), ('POSTFLOP', 'postflop'), ('PLOPREDATA', 'plo_preflop_data'), ('PLOSOLVER', 'plo_solver'), ('SOLVER3', 'solver3'), ('APPMULTI', 'app_multi'), ('PFCORE', 'pf_worker'), ('PFPOOL', 'pfpool'), ('AGGDATA', 'aggregate_data'), ('FLOPLIB', 'flop_library'), ('PREFLOPDATA', 'preflop_data'), ('SCENEXT', 'scen_ext'), ('APPSOLVER', 'app_solver'), ('APPTOOLS', 'app_tools'), ('APPTOOLS2', 'app_tools2'), ('TRSPOTS', 'trainer_spots'), ('APPTRAIN', 'app_trainer'), ('CHAMPSTATS', 'champ_stats'), ('CHAMPIONS', 'champions'), ('APPCHAMP', 'app_champions'), ('LIVEMODEL', 'live_model'), ('LIVEMULTI', 'live_multi'), ('VARIANTSDATA', 'variants_data'), ('VARIANTSQ', 'variants_q'), ('OMAHACALIB', 'omaha_calib'), ('LIVE', 'live'), ('APPLIVE', 'app_live'), ('APPTRACKS', 'app_tracks'), ('APPSTUDIO', 'app_studio'), ('APPPRO', 'app_pro'), ('HANDQUIZ', 'handquiz_data'), ('APPPRACTICE', 'app_practice'), ('REVIEW', 'review'), ('LEGENDS', 'legends'), ('APPLEGENDS', 'app_legends'), ('APPREVIEW', 'app_review'), ('NETGAME', 'netgame'), ('APPFRIENDS', 'app_friends'), ('APPWAVE3', 'app_wave3'), ('APPLEARN', 'app_learn'), ('APPDEBUTER', 'app_debuter'), ('APP360', 'app_360'), ('APPTOOLS3', 'app_tools3'), ('APPUI', 'app_ui')]:
    js = open(f'src/{f}.js', encoding='utf-8').read()
    assert '</script' not in js, f
    t = t.replace(f'/*__{key}__*/', js)
wsrc = ''.join(open(f'src/{f}.js', encoding='utf-8').read() + '\n' for f in ['engine', 'board', 'postflop', 'pf_worker'])
assert '</script' not in wsrc
t = t.replace('/*__PFSRC__*/', wsrc)
open('sigma52.html', 'w', encoding='utf-8').write(t)
print('sigma52.html', len(t.encode()), 'octets')
PY
node tools/build_offline.js
