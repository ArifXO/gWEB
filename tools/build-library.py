# Builds src/lib/library.json and src/lib/howto.json from Free Exercise DB (public domain).
# Usage: python3 tools/build-library.py exercises.json src/lib/catalogue.ts src/lib/library.json src/lib/howto.json
# exercises.json: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json
import json, re, sys
src, cat_ts, out_meta, out_howto = sys.argv[1:5]
d = json.load(open(src))
MUS = {'quadriceps':'Quads','shoulders':'Shoulders','abdominals':'Core','chest':'Chest','hamstrings':'Hamstrings','triceps':'Triceps','biceps':'Biceps','lats':'Back','middle back':'Back','lower back':'Back','calves':'Calves','forearms':'Forearms','glutes':'Glutes','traps':'Back','adductors':'Quads','neck':'Back','abductors':'Glutes'}
EQ = {'barbell':'Barbell','dumbbell':'Dumbbell','other':'Other','body only':'Bodyweight','cable':'Cable',None:'Other','machine':'Machine','kettlebells':'Kettlebell','bands':'Band','medicine ball':'Other','exercise ball':'Other','foam roll':'Other','e-z curl bar':'EZ bar'}
slug = lambda s: re.sub(r'(^-|-$)', '', re.sub(r'[^a-z0-9]+', '-', s.lower()))
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower().replace('dumbbell','db').replace('barbell','bb'))

def pattern(name, prim, cat, force):
    n = name.lower()
    rules = [
        ('run', r'treadmill|jog|run|sprint|elliptical|stair|bike|bicycl|cycling|rowing machine|rope jump|jump rope|skipping'),
        ('jump', r'jump|hop|bound|box |burpee|skater'),
        ('plank', r'plank|hollow|bridge hold|l-sit|hang$|dead hang'),
        ('legraise', r'leg raise|knee raise|toes to bar|knee tuck|flutter|scissor'),
        ('crunch', r'crunch|sit-up|situp|sit up|v-up|jackknife|russian twist|ab roll|rollout|wheel|dead bug|oblique'),
        ('hipthrust', r'hip thrust|glute bridge|bridge|hip lift|pelvic|kickback'),
        ('calf', r'calf|calves|heel raise'),
        ('legext', r'leg extension'),
        ('legcurl', r'leg curl|hamstring curl|nordic|glute ham'),
        ('lunge', r'lunge|split squat|step-up|step up|stepup|pistol'),
        ('squat', r'squat|leg press|hack|thruster|wall sit|sissy'),
        ('hinge', r'deadlift|rdl|good morning|clean|snatch|swing|hyperextension|back extension|pull through|rack pull|stiff'),
        ('pullup', r'pull-up|pullup|pull up|chin|pulldown|pull-down|lat pull|muscle up'),
        ('dip', r'\bdip'),
        ('pushup', r'push-up|pushup|push up|press-up'),
        ('bench', r'bench press|chest press|floor press|incline|decline|fly|flye|pec deck|crossover|pullover'),
        ('ohp', r'shoulder press|overhead|military|arnold|push press|jerk|handstand|landmine press'),
        ('raise', r'lateral raise|front raise|side raise|rear delt|reverse fly|face pull|upright row|shrug|raise'),
        ('row', r'\brow|seal|inverted'),
        ('curl', r'curl'),
        ('triext', r'triceps|tricep|skull|pushdown|push-down|extension|kickback'),
        ('carry', r'carry|walk|farmer|yoke|sled|drag|push'),
    ]
    for p, rx in rules:
        if re.search(rx, n): return p
    by = {'Quads':'squat','Glutes':'hipthrust','Hamstrings':'hinge','Back':'row','Chest':'bench','Shoulders':'ohp','Biceps':'curl','Triceps':'triext','Core':'crunch','Calves':'calf','Forearms':'curl'}
    return 'run' if cat == 'cardio' else by.get(prim, 'squat')

# existing curated catalogue (keeps ids stable)
cur = re.findall(r"\[(['\"])(.+?)\1, '([^']+)', '([^']+)'\]", open(cat_ts).read())
curated = [(nm.replace("\\'", "'"), m, e) for _, nm, m, e in cur if m in set(MUS.values()) | {'Full body', 'Cardio'} and len(nm) < 40]
cur_norm = {norm(n): slug(n) for n, _, _ in curated}

meta, howto = [], {}
seen = set(cur_norm)
cur_extra = {}
for x in d:
    if x['category'] in ('stretching',) or x.get('equipment') == 'foam roll': continue
    prim = MUS.get(x['primaryMuscles'][0], 'Full body') if x['primaryMuscles'] else 'Full body'
    if x['category'] == 'cardio': prim = 'Cardio'
    if x['category'] in ('olympic weightlifting',) and prim in ('Quads','Hamstrings','Shoulders'): prim = 'Full body'
    sec = sorted({MUS[m] for m in x['primaryMuscles'][1:] + x['secondaryMuscles'] if m in MUS} - {prim})
    k = norm(x['name'])
    steps = [s.strip() for s in x['instructions'] if s.strip()]
    if k in cur_norm:  # enrich a curated entry
        cid = cur_norm[k]
        if steps: howto[cid] = steps
        cur_extra[cid] = {'secondary': sec, 'level': x['level']}
        continue
    if k in seen: continue
    seen.add(k)
    eid = slug(x['name'])
    meta.append({'id': eid, 'name': x['name'].strip(), 'muscle': prim, 'equipment': EQ.get(x.get('equipment'), 'Other'), 'secondary': sec, 'level': x['level'], 'pattern': pattern(x['name'], prim, x['category'], x.get('force'))})
    if steps: howto[eid] = steps

# Curated names are often shorter than the dataset's ("Bench Press" vs "Barbell Bench Press - Medium Grip").
# Borrow steps from the closest dataset entry that has every word of the curated name plus its equipment.
def words(s):
    s = s.lower().replace('-', ' ').replace('flye', 'fly').replace('pushup', 'push up').replace('situp', 'sit up')
    return {w[:-1] if len(w) > 3 and w.endswith('s') else w for w in re.findall(r'[a-z0-9]+', s)} - {'the', 'a', 'with'}
ALIAS = {'back-squat': 'Barbell Squat', 'pause-squat': 'Barbell Squat', 'seated-cable-row': 'Seated Cable Rows', 'lying-leg-curl': 'Lying Leg Curls',
         'kettlebell-swing': 'One-Arm Kettlebell Swings', 'pec-deck': 'Butterfly', 'reverse-pec-deck': 'Reverse Machine Flyes', 'chest-dip': 'Dips - Chest Version',
         'triceps-dip': 'Dips - Triceps Version', 'bulgarian-split-squat': 'Split Squat with Dumbbells', 'stiff-leg-deadlift': 'Stiff-Legged Barbell Deadlift',
         'dumbbell-romanian-deadlift': 'Stiff-Legged Dumbbell Deadlift', 'back-extension': 'Hyperextensions (Back Extensions)', 'farmer-s-carry': "Farmer's Walk",
         'ab-wheel-rollout': 'Ab Roller', 'seated-dumbbell-shoulder-press': 'Seated Dumbbell Press', 'machine-chest-press': 'Leverage Chest Press',
         'kettlebell-goblet-squat': 'Goblet Squat', 'hanging-knee-raise': 'Hanging Leg Raise', 'pendlay-row': 'Bent Over Barbell Row',
         'stationary-bike': 'Bicycling, Stationary', 'rowing-machine': 'Rowing, Stationary', 'stair-climber': 'Step Mill', 'jump-rope': 'Rope Jumping',
         'overhead-dumbbell-triceps-extension': 'Standing Dumbbell Triceps Extension', 'leg-press-calf-raise': 'Calf Press On The Leg Press Machine'}
by_name = {x['name'].strip(): x for x in d}
EQW = {'Barbell': 'barbell', 'Dumbbell': 'dumbbell', 'Cable': 'cable', 'Machine': 'machine', 'Kettlebell': 'kettlebell', 'EZ bar': 'ez', 'Smith machine': 'smith'}
pool = [(words(x['name']), x) for x in d if x['instructions']]
for n, m, e in curated:
    i = slug(n)
    if i in howto: continue
    want = words(n)
    hits = [by_name[ALIAS[i]]] if ALIAS.get(i) in by_name else [x for w, x in pool if want <= w]
    eq = EQW.get(e)
    hits.sort(key=lambda x: (0 if eq and eq in x['name'].lower() else 1, 0 if 'medium' in x['name'].lower() else 1, len(x['name'])))
    if hits:
        howto[i] = [t.strip() for t in hits[0]['instructions'] if t.strip()]
        cur_extra.setdefault(i, {})
        if 'secondary' not in cur_extra[i]:
            pm = hits[0]['primaryMuscles'] + hits[0]['secondaryMuscles']
            cur_extra[i]['secondary'] = sorted({MUS[x] for x in pm if x in MUS} - {m})
            cur_extra[i]['level'] = hits[0]['level']

# Our own steps for the few common exercises the dataset doesn't cover.
MANUAL = {
    'low-to-high-cable-fly': ['Set both cable handles low. Stand in the middle with one foot forward.', 'Hold the handles by your hips with a slight bend in the elbows.', 'Sweep your hands up and together until they meet at chest height.', 'Squeeze your chest for a moment, then lower slowly to the start.'],
    'chest-supported-dumbbell-row': ['Set an incline bench to about 30 degrees and lie face down on it with a dumbbell in each hand.', 'Let your arms hang straight down.', 'Pull the dumbbells up toward your hips, driving the elbows back.', 'Pause with your shoulder blades squeezed, then lower under control.'],
    'pike-push-up': ['Start in a push-up position, then walk your feet in and raise your hips so your body makes an upside-down V.', 'Bend your elbows to lower the top of your head toward the floor between your hands.', 'Press back up until your arms are straight.'],
    'diamond-push-up': ['Get into a push-up position with your hands close together under your chest, thumbs and index fingers touching.', 'Keep your body straight from head to heels.', 'Lower your chest to your hands, keeping elbows close to your sides.', 'Push back up until your arms are straight.'],
    'reverse-wrist-curl': ['Sit with your forearms on your thighs, palms facing down, holding a light dumbbell or bar.', 'Let your wrists drop down.', 'Lift the backs of your hands up as far as you can, moving only at the wrist.', 'Lower slowly and repeat.'],
    'dead-hang': ['Grab a pull-up bar with both hands, slightly wider than your shoulders.', 'Let your body hang with your arms straight and your feet off the floor.', 'Keep your shoulders active, not shrugged up to your ears, and breathe steadily.', 'Hold for the time you planned, then step down.'],
    'nordic-curl': ['Kneel on a pad with your ankles anchored under something solid or held by a partner.', 'Keep your body straight from knees to head.', 'Lean forward slowly, resisting with your hamstrings for as long as you can.', 'Catch yourself with your hands, then push back up and use your hamstrings to return.'],
    'hip-abduction-machine': ['Sit in the machine with the pads against the outside of your knees.', 'Push your knees outward as far as is comfortable.', 'Pause, then let your legs come back together slowly.'],
    'hip-adduction-machine': ['Sit in the machine with the pads against the inside of your knees and your legs apart.', 'Squeeze your legs together until the pads meet.', 'Pause, then let your legs open slowly.'],
    'single-leg-calf-raise': ['Stand on one foot on the edge of a step, holding something for balance.', 'Let your heel drop below the step.', 'Rise up onto your toes as high as you can.', 'Lower slowly and repeat, then switch legs.'],
    'decline-sit-up': ['Lie on a decline bench with your feet hooked under the pads.', 'Cross your arms on your chest or keep your hands by your head.', 'Curl your body up until your chest is near your knees.', 'Lower back down slowly.'],
    'burpee': ['Stand tall, then squat down and place your hands on the floor.', 'Jump your feet back into a push-up position.', 'Jump your feet back toward your hands.', 'Jump straight up with your arms overhead and land softly.'],
}
for k, v in MANUAL.items():
    howto.setdefault(k, v)

# curated entries: patterns + any enrichment
cur_meta = {}
for n, m, e in curated:
    i = slug(n)
    cur_meta[i] = {'pattern': pattern(n, m, 'cardio' if m == 'Cardio' else 'strength', None), **cur_extra.get(i, {})}
json.dump({'curated': cur_meta, 'more': meta}, open(out_meta, 'w'), separators=(',', ':'))
json.dump(howto, open(out_howto, 'w'), separators=(',', ':'))
import collections
print(len(meta), 'added;', len(howto), 'with how-to;', sum(1 for i in cur_meta if i in howto), 'curated with how-to')
print(collections.Counter(x['pattern'] for x in meta).most_common())
