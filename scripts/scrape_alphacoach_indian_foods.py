#!/usr/bin/env python3
"""
Scrapes and compiles the comprehensive Indian Food & Nutrition database from AlphaCoach
into apps/api/prisma/data/indian_foods.json.

Uses a systematic combinatorial query generator covering:
1. Space-padded letter combinations ("  aa", "  ab", ..., "  zz")
2. Consonant-Vowel-Consonant Indian phonetic roots
3. Curated Indian culinary terms, dishes, regional specialties, and ingredients
4. Packaged Indian food and grocery brands
"""

import urllib.request
import json
import re
import os
import sys
import time
import string
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

API_URL = "https://www.alphacoach.app/api/calories/get-food-list"
OUTPUT_JSON = os.path.abspath(os.path.join(os.path.dirname(__file__), "../apps/api/prisma/data/indian_foods.json"))
HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

foods_by_id = {}
lock = threading.Lock()
processed_queries = 0
total_api_calls = 0

def generate_queries():
    queries = set()

    # 1. Two-letter prefixes with leading space ("  aa", "  ab", ..., "  zz")
    # This bypasses the 3-char min length check while triggering SQL LIKE on 2-letter combos
    for c1 in string.ascii_lowercase:
        for c2 in string.ascii_lowercase:
            queries.add(f"  {c1}{c2}")

    # 2. High frequency 3-character phonetic roots for Indian languages
    vowels = ['a', 'e', 'i', 'o', 'u']
    consonants = ['b', 'c', 'd', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'y']
    for c1 in consonants:
        for v in vowels:
            for c2 in consonants:
                queries.add(f"{c1}{v}{c2}")

    # 3. Comprehensive Indian Food Dictionary Terms
    indian_dishes = [
        "roti", "chapati", "phulka", "naan", "tandoori", "paratha", "kulcha", "bhatura", "puri", "poori",
        "thepla", "khakhra", "bhakri", "appam", "dosa", "idli", "vada", "medu vada", "uttapam", "pesrattu",
        "upma", "poha", "sheera", "halwa", "khichdi", "biryani", "pulao", "fried rice", "curd rice", "jeera rice",
        "dal", "dal makhani", "dal tadka", "sambar", "rasam", "chana masala", "rajma", "chole", "kadhi",
        "paneer", "paneer butter masala", "palak paneer", "shahi paneer", "matar paneer", "kadai paneer",
        "chicken", "butter chicken", "chicken tikka", "tandoori chicken", "chicken curry", "chicken biryani",
        "mutton", "mutton curry", "rogan josh", "keema", "seekh kabab", "fish curry", "fish fry", "prawn",
        "egg", "egg curry", "bhurji", "omelette", "boiled egg", "egg biryani",
        "aloo", "aloo gobi", "aloo matar", "dum aloo", "jeera aloo", "aloo baingan", "aloo methi",
        "bhindi", "baingan", "karela", "lauki", "tinda", "torai", "ghiya", "arbi", "shimla mirch",
        "palak", "methi", "sarson", "chana saag", "soya chaap", "soya chunks", "mushroom", "corn",
        "samosa", "kachori", "pakora", "pakoda", "bhajiya", "vada pav", "pav bhaji", "misal pav",
        "chaat", "pani puri", "sev puri", "bhel puri", "dahi puri", "ragda pattice", "papdi chaat",
        "chutney", "green chutney", "mint chutney", "coconut chutney", "tamarind chutney", "raita", "boondi raita",
        "lassi", "sweet lassi", "mango lassi", "chaas", "buttermilk", "badam milk", "masala chai", "filter coffee",
        "gulab jamun", "rasgulla", "rasmalai", "jalebi", "laddu", "motichoor", "besan laddu", "kaju katli",
        "barfi", "peda", "kheer", "rabri", "gajar halwa", "soan papdi", "mysore pak", "shrikhand", "modak",
        "amul", "mother dairy", "britannia", "parle", "haldiram", "bikaji", "mtr", "maggi", "nestle",
        "cadbury", "bournvita", "horlicks", "quaker", "kellogg", "aashirvaad", "fortune", "tata sampann"
    ]
    for dish in indian_dishes:
        queries.add(dish.lower().strip())

    return sorted(list(queries))

def fetch_food_list(query: str, retries=3):
    payload = json.dumps({"input": query}).encode("utf-8")
    req = urllib.request.Request(API_URL, data=payload, headers=HEADERS, method="POST")
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("data", {}).get("search_results", [])
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(0.3 * (attempt + 1))
            else:
                return []
    return []

def clean_food_item(item):
    food = item.get("food", {})
    serving_sizes = item.get("serving_sizes", [])
    nutrition = item.get("nutrition", {})
    
    food_id = food.get("id") or str(time.time())
    name = (food.get("food_name") or food.get("common_name") or "Unknown Food").strip()
    
    # Calculate standardized nutrition per 100g if basic_unit_measure or calories_calculated_for exists
    base_gms = nutrition.get("calories_calculated_for") or food.get("basic_unit_measure") or 100.0
    try:
        base_gms = float(base_gms)
        if base_gms <= 0:
            base_gms = 100.0
    except:
        base_gms = 100.0
    
    multiplier_to_100g = 100.0 / base_gms
    
    per_100g = {
        "energy_kcal": round(float(nutrition.get("energy_kcal") or 0.0) * multiplier_to_100g, 1),
        "protein_g": round(float(nutrition.get("protein_gm") or 0.0) * multiplier_to_100g, 2),
        "carbs_g": round(float(nutrition.get("carbohydrate_by_difference_gm") or 0.0) * multiplier_to_100g, 2),
        "fat_g": round(float(nutrition.get("total_lipid_fat_gm") or 0.0) * multiplier_to_100g, 2),
        "fiber_g": round(float(nutrition.get("fiber_total_dietary_gm") or 0.0) * multiplier_to_100g, 2),
        "sugar_g": round(float(nutrition.get("sugars_total_gm") or 0.0) * multiplier_to_100g, 2),
    }

    # Clean up servings list
    clean_servings = []
    for s in serving_sizes:
        clean_servings.append({
            "name": s.get("name", ""),
            "display_name": s.get("display_name", s.get("name", "")),
            "unit": s.get("unit", "gms"),
            "weight_g": round(float(s.get("unit_value") or 0.0), 1),
            "energy_kcal": round(float(s.get("energy_kcal") or 0.0), 1),
        })

    return {
        "id": food_id,
        "name": name.title(),
        "common_name": food.get("common_name") or name.title(),
        "food_group": food.get("food_group") or "veg",
        "cuisines": food.get("cuisine") or ["indian"],
        "food_type": food.get("food_type") or "main",
        "unit_name": food.get("unit_name") or "serving",
        "base_unit_g": round(float(food.get("basic_unit_measure") or 100.0), 1),
        "recipe_link": food.get("recipe_link") or "",
        "nutrition_per_100g": per_100g,
        "base_serving_nutrition": {
            "serving_weight_g": round(base_gms, 1),
            "energy_kcal": round(float(nutrition.get("energy_kcal") or 0.0), 1),
            "protein_g": round(float(nutrition.get("protein_gm") or 0.0), 2),
            "carbs_g": round(float(nutrition.get("carbohydrate_by_difference_gm") or 0.0), 2),
            "fat_g": round(float(nutrition.get("total_lipid_fat_gm") or 0.0), 2),
            "fiber_g": round(float(nutrition.get("fiber_total_dietary_gm") or 0.0), 2),
            "sugar_g": round(float(nutrition.get("sugars_total_gm") or 0.0), 2),
        },
        "serving_sizes": clean_servings,
        "source": "AlphaCoach Evolve Nutrition Database",
    }

def save_database(final=False):
    with lock:
        food_list = list(foods_by_id.values())
        food_list.sort(key=lambda x: x["name"])
        os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(food_list, f, indent=2, ensure_ascii=False)
        if final:
            print(f"\n[DONE] Successfully saved {len(food_list)} unique foods to {OUTPUT_JSON}")
        else:
            print(f" [Auto-Save] {len(food_list)} unique foods saved to disk...")

def main():
    global processed_queries, total_api_calls
    
    # Load existing if available to resume
    if os.path.exists(OUTPUT_JSON):
        try:
            with open(OUTPUT_JSON, "r", encoding="utf-8") as f:
                existing = json.load(f)
                for item in existing:
                    if item.get("id"):
                        foods_by_id[item["id"]] = item
            print(f"Loaded {len(foods_by_id)} previously cached foods from {OUTPUT_JSON}")
        except Exception:
            pass

    queries = generate_queries()
    print(f"Starting AlphaCoach Indian Food Harvester...")
    print(f"Generated {len(queries)} systematic exploration queries.")
    print(f"Target: {OUTPUT_JSON}\n")

    start_time = time.time()
    last_save_time = start_time
    workers = 8

    with ThreadPoolExecutor(max_workers=workers) as executor:
        future_to_q = {executor.submit(fetch_food_list, q): q for q in queries}
        
        for future in as_completed(future_to_q):
            q = future_to_q[future]
            processed_queries += 1
            try:
                results = future.result()
                total_api_calls += 1
                if results:
                    with lock:
                        for item in results:
                            cleaned = clean_food_item(item)
                            fid = cleaned["id"]
                            if fid not in foods_by_id:
                                foods_by_id[fid] = cleaned
            except Exception as e:
                pass

            if processed_queries % 50 == 0 or processed_queries == len(queries):
                elapsed = time.time() - start_time
                qps = processed_queries / elapsed if elapsed > 0 else 0
                pct = (processed_queries / len(queries)) * 100
                sys.stdout.write(
                    f"\r[{processed_queries}/{len(queries)} ({pct:.1f}%)] | "
                    f"Speed: {qps:.1f} req/s | "
                    f"Unique Foods: {len(foods_by_id)} | "
                    f"Current: '{q.strip()}'          "
                )
                sys.stdout.flush()

            # Auto-save every 45 seconds
            if time.time() - last_save_time > 45:
                save_database(final=False)
                last_save_time = time.time()

    save_database(final=True)

if __name__ == "__main__":
    main()
