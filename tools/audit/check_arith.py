# Vérifie les calculs écrits en clair dans le cours : « a × b ÷ c = d », « a + b = c », etc. (décimales françaises).
# Signale les égalités dont le résultat diffère du calcul de plus que l'arrondi affiché. Usage : python3 check_arith.py course.txt
import re, sys
txt = open(sys.argv[1]).read()
num = r'\d+(?:[  ]\d{3})*(?:,\d+)?'
tok = rf'(?:{num}|[()+\-−×÷*/^√ ]|\s)+'
pat = re.compile(rf'((?:\(|√\(?)?{num}\s*[+\-−×÷*/]\s*{tok}?)\s*[=≈]\s*(\(?{num})\s*(%?)')
def tofloat(s): return float(s.replace(' ','').replace(' ','').replace(',','.'))
bad = 0; n = 0
for line in txt.split('\n'):
    for m in pat.finditer(line):
        expr, res, pc = m.group(1), m.group(2).lstrip('('), m.group(3)
        e = expr.replace('×','*').replace('÷','/').replace('−','-').replace(' ','')
        e = re.sub(r'(\d) (\d{3})', r'\1\2', e)
        e = re.sub(r'(\d),(\d)', r'\1.\2', e).replace('√','sqrt').replace('^','**')
        if e.count('(') != e.count(')'): e = e.rstrip('( ') ; e += ')' * (e.count('(') - e.count(')'))
        try:
            from math import sqrt
            v = eval(e, {'sqrt': sqrt})
        except Exception: continue
        n += 1
        r = tofloat(res); dec = len(res.split(',')[1]) if ',' in res else 0
        cands = [v, v * 100] if pc else [v]
        tol = 0.51 * 10 ** (-dec) + 1e-9
        if not any(abs(c - r) <= max(tol, abs(r) * 0.006) for c in cands):
            bad += 1; print(f'⚠ {expr.strip()} = {res}{pc}  (calcul : {v:.4g})   …{line.strip()[:160]}')
print(f'{n} calculs vérifiés, {bad} écarts', file=sys.stderr)
