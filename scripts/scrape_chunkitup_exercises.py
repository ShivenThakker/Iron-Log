#!/usr/bin/env python3
"""
Scrapes all exercises from https://chunkitup.com/exercises-index
Extracts all metadata, steps, form cues, muscles, variations, programming guidelines,
and video links, then compiles both a rich JSON database and a SQLite database.
"""

import urllib.request
import json
import re
import os
import sys
import time
import sqlite3
from concurrent.futures import ThreadPoolExecutor, as_completed
from bs4 import BeautifulSoup

INDEX_URL = "https://chunkitup.com/exercises-index"
BASE_URL = "https://chunkitup.com"
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Muscle normalization mapping to Iron-Log standard groups:
# ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Calves', 'Glutes', 'Core', 'Forearms', 'Traps', 'Rear Delts']
def map_to_standard_muscle(muscle_name: str) -> str:
    m = muscle_name.lower().strip()
    if any(k in m for k in ['pectoral', 'chest']):
        return 'Chest'
    if any(k in m for k in ['latissimus', 'lats', 'rhomboid', 'teres', 'middle back', 'lower back']):
        return 'Back'
    if 'trapezius' in m or 'traps' in m:
        return 'Traps'
    if 'rear delt' in m or 'posterior delt' in m:
        return 'Rear Delts'
    if 'delt' in m or 'shoulder' in m:
        return 'Shoulders'
    if 'biceps' in m or 'brachialis' in m:
        return 'Biceps'
    if 'triceps' in m:
        return 'Triceps'
    if any(k in m for k in ['abdominis', 'oblique', 'core', 'inscriptions', 'abs']):
        return 'Core'
    if any(k in m for k in ['femoris', 'quad', 'vastus']):
        return 'Quads'
    if any(k in m for k in ['hamstring', 'semitendinosus', 'semimembranosus']):
        return 'Hamstrings'
    if any(k in m for k in ['glute', 'buttock']):
        return 'Glutes'
    if any(k in m for k in ['gastrocnemius', 'soleus', 'cal']):
        return 'Calves'
    if any(k in m for k in ['forearm', 'brachioradialis', 'wrist']):
        return 'Forearms'
    return 'Core'

def infer_equipment(name: str, tags: list, category: str, text: str) -> str:
    n = name.lower()
    # 1. High precision matching on exercise name
    if 'band' in n:
        return 'Bands'
    if 'dumbbell' in n:
        return 'Dumbbell'
    if 'goblet' in n:
        return 'Dumbbell'
    if 'hack squat' in n:
        return 'Machine'
    if 'barbell' in n or any(w in n for w in ['bench press', 'deadlift', 'back squat', 'front squat', 'zercher', 'pendlay', 'overhead squat', 'box squat', 'pin press', 'board press', 'chain press']):
        return 'Barbell'
    if 'cable' in n:
        return 'Cable'
    if 'machine' in n or 'pec deck' in n:
        return 'Machine'
    if any(k in n for k in ['pull-up', 'push-up', 'dip', 'planche', 'lever', 'sit-up', 'crunch', 'lunge', 'squat', 'chin-up', 'handstand', 'muscle-up', 'bridge', 'pike', 'leg raise']):
        return 'Bodyweight'

    # 2. Check tags & category
    t = (' '.join(tags) + ' ' + category).lower()
    if 'calisthenics' in t or 'bodyweight' in t:
        return 'Bodyweight'
    if 'dumbbell' in t:
        return 'Dumbbell'
    if 'barbell' in t:
        return 'Barbell'
    if 'cable' in t:
        return 'Cable'
    if 'machine' in t:
        return 'Machine'
    if 'band' in t:
        return 'Bands'

    # 3. Check instructions text
    txt = text.lower()
    if 'barbell' in txt:
        return 'Barbell'
    if 'dumbbell' in txt:
        return 'Dumbbell'
    if 'cable' in txt:
        return 'Cable'
    if 'machine' in txt:
        return 'Machine'
    if 'band' in txt:
        return 'Bands'
    return 'Bodyweight'

def infer_exercise_type(name: str, desc: str) -> str:
    combined = (name + ' ' + desc).lower()
    if any(k in combined for k in ['hang', 'plank', 'hold', 'carry', 'walk', 'lever', 'planche', 'isometric']):
        return 'timed'
    return 'reps'

def fetch_url(url: str, retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.read().decode('utf-8', errors='ignore')
        except Exception as e:
            if attempt == retries - 1:
                raise e
            time.sleep(1)
    return ""

def get_exercise_index():
    print(f"Fetching exercise index from {INDEX_URL}...")
    html = fetch_url(INDEX_URL)
    soup = BeautifulSoup(html, 'html.parser')
    cards = []

    for li in soup.find_all('li', class_=lambda c: c and 'border' in c and 'rounded-2xl' in c):
        a = li.find('a', href=re.compile(r'^/exercises/[a-z0-9\-]+'))
        if not a:
            continue
        href = a['href']
        slug = href.replace('/exercises/', '').strip()
        if slug in ['index', 'muscles'] or slug.startswith('muscles/'):
            continue

        h3 = a.find('h3')
        name = h3.get_text(strip=True) if h3 else slug

        ps = a.find_all('p')
        desc = ''
        targets = []
        for p in ps:
            p_text = p.get_text(strip=True)
            if p_text.startswith('Targets:'):
                targets = [t.strip() for t in p_text.replace('Targets:', '').split(',') if t.strip()]
            elif not desc:
                desc = p_text

        tags = [span.get_text(strip=True) for span in a.find_all('span', class_=lambda c: c and 'rounded-full' in c)]

        cards.append({
            'name': name,
            'slug': slug,
            'url': f"{BASE_URL}{href}",
            'index_description': desc,
            'index_targets': targets,
            'index_tags': tags
        })

    print(f"Discovered {len(cards)} exercises from index.")
    return cards

def parse_exercise_page(card: dict) -> dict:
    url = card['url']
    html = fetch_url(url)
    soup = BeautifulSoup(html, 'html.parser')

    item = {
        'id': card['slug'],
        'slug': card['slug'],
        'name': card['name'],
        'url': url,
        'index_description': card['index_description'],
        'index_targets': card['index_targets'],
        'index_tags': card['index_tags'],
        'difficulty': 'Intermediate',
        'category': 'General',
        'mechanics': 'Compound',
        'movement_pattern': '',
        'force': '',
        'primary_muscles': [],
        'secondary_muscles': [],
        'stabilizers': [],
        'steps': [],
        'instructions': '',
        'coaching_cues': [],
        'common_mistakes': [],
        'easier_variations': [],
        'harder_variations': [],
        'programming': {},
        'youtube_id': '',
        'youtube_thumbnail': '',
    }

    # 1. H1 and Page Overview
    h1 = soup.find('h1')
    if h1:
        text = h1.get_text(strip=True)
        if ':' in text:
            item['name'] = text.split(':')[0].strip()

    # 2. JSON-LD Structured Data
    for s in soup.find_all('script', type='application/ld+json'):
        try:
            j = json.loads(s.string)
            if j.get('@type') == 'HowTo':
                item['full_description'] = j.get('description', '')
                steps = []
                for st in j.get('step', []):
                    steps.append({
                        'step': st.get('position', len(steps) + 1),
                        'name': st.get('name', ''),
                        'text': st.get('text', '')
                    })
                item['steps'] = steps
        except Exception:
            pass

    # 3. Exercise Details Sidebar (dl with dt/dd)
    dl = soup.find('dl')
    if dl:
        for dt, dd in zip(dl.find_all('dt'), dl.find_all('dd')):
            key = dt.get_text(strip=True).lower()
            val = dd.get_text(strip=True)
            if 'difficulty' in key:
                item['difficulty'] = val
            elif 'category' in key:
                item['category'] = val
            elif 'mechanics' in key:
                item['mechanics'] = val
            elif 'movement' in key:
                item['movement_pattern'] = val
            elif 'force' in key:
                item['force'] = val

    # 4. Muscle Map Section
    muscle_sec = None
    for sec in soup.find_all('section'):
        h2 = sec.find('h2')
        if h2 and 'Muscle map' in h2.get_text():
            muscle_sec = sec
            break

    if muscle_sec:
        h3s = muscle_sec.find_all('h3')
        ps = muscle_sec.find_all('p')
        for h3, p in zip(h3s, ps):
            k = h3.get_text(strip=True).lower()
            val = [m.strip() for m in p.get_text().split(',') if m.strip()]
            if 'primary' in k:
                item['primary_muscles'] = val
            elif 'secondary' in k:
                item['secondary_muscles'] = val
            elif 'stabilizer' in k:
                item['stabilizers'] = val

    # Fallback for primary muscles from card targets if missing
    if not item['primary_muscles'] and card['index_targets']:
        item['primary_muscles'] = card['index_targets']

    # 5. YouTube video
    yt_img = soup.find('img', src=re.compile(r'img\.youtube\.com/vi/([^/]+)/'))
    if yt_img:
        m = re.search(r'img\.youtube\.com/vi/([^/]+)/', yt_img['src'])
        if m:
            item['youtube_id'] = m.group(1)
            item['youtube_thumbnail'] = yt_img['src']

    # 6. Detailed Lists (Common mistakes, Coaching cues, Variations)
    for sec in soup.find_all('section'):
        h2 = sec.find('h2')
        if not h2:
            continue
        title = h2.get_text(strip=True).lower()
        if 'common mistakes' in title:
            item['common_mistakes'] = [li.get_text(strip=True) for li in sec.find_all('li')]
        elif 'coaching cues' in title:
            item['coaching_cues'] = [li.get_text(strip=True) for li in sec.find_all('li')]
        elif 'easier variations' in title:
            item['easier_variations'] = [li.get_text(strip=True) for li in sec.find_all('li')]
        elif 'harder variations' in title:
            item['harder_variations'] = [li.get_text(strip=True) for li in sec.find_all('li')]
        elif 'sets, reps and programming' in title:
            prog = {}
            for div in sec.find_all('div', class_=lambda c: c and 'rounded-2xl' in c):
                h3 = div.find('h3')
                p = div.find('p')
                if h3 and p:
                    prog[h3.get_text(strip=True)] = p.get_text(strip=True)
            item['programming'] = prog

    # Combine step instructions into clean paragraph
    if item['steps']:
        item['instructions'] = '\n'.join([f"{s['step']}. {s['name']}: {s['text']}" for s in item['steps']])
    else:
        item['instructions'] = item.get('full_description', card['index_description'])

    # Standardize muscles for Iron-Log database
    if item['primary_muscles']:
        item['standardized_primary_muscle'] = map_to_standard_muscle(item['primary_muscles'][0])
    elif item['category']:
        item['standardized_primary_muscle'] = map_to_standard_muscle(item['category'])
    else:
        item['standardized_primary_muscle'] = 'Chest'

    sec_set = set()
    for m in item['primary_muscles'][1:] + item['secondary_muscles']:
        mapped = map_to_standard_muscle(m)
        if mapped != item['standardized_primary_muscle']:
            sec_set.add(mapped)
    item['standardized_secondary_muscles'] = sorted(list(sec_set))

    # Infer Equipment & Exercise Type
    item['equipment'] = infer_equipment(
        item['name'],
        item['index_tags'],
        item['category'],
        item['instructions']
    )
    item['exercise_type'] = infer_exercise_type(item['name'], item['instructions'])
    if item['exercise_type'] == 'timed':
        item['default_duration_seconds'] = 45
    else:
        item['default_duration_seconds'] = None

    return item

def scrape_all():
    cards = get_exercise_index()
    exercises = []
    total = len(cards)

    print(f"Beginning concurrent scrape of {total} exercise pages with 10 workers...")
    t0 = time.time()

    completed_count = 0
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_card = {executor.submit(parse_exercise_page, card): card for card in cards}
        for future in as_completed(future_to_card):
            card = future_to_card[future]
            try:
                res = future.result()
                exercises.append(res)
                completed_count += 1
                if completed_count % 20 == 0 or completed_count == total:
                    elapsed = time.time() - t0
                    print(f"  [{completed_count}/{total}] scraped in {elapsed:.1f}s - {res['name']}")
            except Exception as e:
                print(f"Error scraping {card['slug']}: {e}", file=sys.stderr)

    # Sort alphabetically by name
    exercises.sort(key=lambda x: x['name'])
    elapsed = time.time() - t0
    print(f"\nScraping complete! {len(exercises)} exercises fetched in {elapsed:.1f}s.")

    # 1. Save canonical Prisma seed asset
    api_json_path = os.path.abspath("apps/api/prisma/data/exercises_chunkitup.json")
    os.makedirs(os.path.dirname(api_json_path), exist_ok=True)
    with open(api_json_path, "w", encoding="utf-8") as f:
        json.dump(exercises, f, indent=2, ensure_ascii=False)
    print(f"Saved Prisma seed asset to {api_json_path}")

    # 2. Build SQLite database
    sqlite_path = os.path.abspath("data/exercises.db")
    if os.path.exists(sqlite_path):
        os.remove(sqlite_path)

    conn = sqlite3.connect(sqlite_path)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE exercises (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE,
        name TEXT NOT NULL,
        category TEXT,
        difficulty TEXT,
        mechanics TEXT,
        force TEXT,
        movement_pattern TEXT,
        equipment TEXT,
        exercise_type TEXT,
        primary_muscle TEXT,
        secondary_muscles TEXT,
        raw_primary_muscles TEXT,
        raw_secondary_muscles TEXT,
        stabilizers TEXT,
        short_description TEXT,
        instructions TEXT,
        steps_json TEXT,
        coaching_cues_json TEXT,
        common_mistakes_json TEXT,
        variations_easier_json TEXT,
        variations_harder_json TEXT,
        programming_json TEXT,
        youtube_id TEXT,
        youtube_thumbnail TEXT,
        source_url TEXT
    )
    """)

    for ex in exercises:
        cur.execute("""
        INSERT INTO exercises VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        """, (
            ex['id'],
            ex['slug'],
            ex['name'],
            ex['category'],
            ex['difficulty'],
            ex['mechanics'],
            ex['force'],
            ex['movement_pattern'],
            ex['equipment'],
            ex['exercise_type'],
            ex['standardized_primary_muscle'],
            json.dumps(ex['standardized_secondary_muscles']),
            json.dumps(ex['primary_muscles']),
            json.dumps(ex['secondary_muscles']),
            json.dumps(ex['stabilizers']),
            ex.get('index_description', ''),
            ex['instructions'],
            json.dumps(ex['steps']),
            json.dumps(ex['coaching_cues']),
            json.dumps(ex['common_mistakes']),
            json.dumps(ex['easier_variations']),
            json.dumps(ex['harder_variations']),
            json.dumps(ex['programming']),
            ex.get('youtube_id', ''),
            ex.get('youtube_thumbnail', ''),
            ex['url']
        ))

    conn.commit()
    conn.close()
    print(f"Saved SQLite database to {sqlite_path}")

    print("\nSummary Statistics:")
    print(f"Total exercises: {len(exercises)}")
    by_muscle = {}
    by_equipment = {}
    for ex in exercises:
        m = ex['standardized_primary_muscle']
        by_muscle[m] = by_muscle.get(m, 0) + 1
        eq = ex['equipment']
        by_equipment[eq] = by_equipment.get(eq, 0) + 1

    print("By Primary Muscle:", json.dumps(by_muscle, indent=2))
    print("By Equipment:", json.dumps(by_equipment, indent=2))

if __name__ == '__main__':
    scrape_all()
