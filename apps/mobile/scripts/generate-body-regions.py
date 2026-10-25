#!/usr/bin/env python3
import os
import sys
import xml.etree.ElementTree as ET
import json

def generate_body_regions():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    mobile_dir = os.path.abspath(os.path.join(script_dir, '..'))
    svg_path = os.path.join(mobile_dir, 'assets', 'body', 'body-regions.svg')
    out_path = os.path.join(mobile_dir, 'constants', 'bodyRegions.ts')

    if not os.path.exists(svg_path):
        print(f"Error: SVG not found at {svg_path}", file=sys.stderr)
        sys.exit(1)

    tree = ET.parse(svg_path)
    root = tree.getroot()

    # Verify root tag
    tag_name = root.tag.split('}')[-1]
    if tag_name != 'svg':
        print(f"Error: Root tag is not <svg>, found <{tag_name}>", file=sys.stderr)
        sys.exit(1)

    width = int(root.attrib.get('width', 1024))
    height = int(root.attrib.get('height', 1024))

    # 1. Fail if transforms exist anywhere
    for elem in root.iter():
        if 'transform' in elem.attrib:
            elem_id = elem.attrib.get('id', 'unnamed')
            print(f"Error: Transform found in element '{elem_id}': {elem.attrib['transform']}", file=sys.stderr)
            sys.exit(1)

    # 2. Extract groups and paths
    groups = root.findall('.//{http://www.w3.org/2000/svg}g') or root.findall('.//g')
    if not groups:
        print("Error: No <g> elements found in SVG", file=sys.stderr)
        sys.exit(1)

    regions = {}
    total_paths = 0

    for group in groups:
        gid = group.attrib.get('id')
        if not gid or not gid.strip():
            print("Error: Found <g> element without an id", file=sys.stderr)
            sys.exit(1)

        gid = gid.strip()
        paths = group.findall('.//{http://www.w3.org/2000/svg}path') or group.findall('.//path')
        if not paths:
            print(f"Error: Group '{gid}' contains no <path> elements", file=sys.stderr)
            sys.exit(1)

        path_entries = []
        for p in paths:
            pid = p.attrib.get('id')
            if not pid or not pid.strip():
                print(f"Error: Found unnamed <path> in group '{gid}'", file=sys.stderr)
                sys.exit(1)
            d = p.attrib.get('d')
            if not d or not d.strip():
                print(f"Error: Path '{pid}' in group '{gid}' has no 'd' attribute", file=sys.stderr)
                sys.exit(1)

            path_entries.append({
                'id': pid.strip(),
                'd': d.strip()
            })
            total_paths += 1

        regions[gid] = path_entries

    print(f"Parsed {len(regions)} regions with {total_paths} paths successfully.")

    regions_json = json.dumps(regions, indent=2)
    ts_content = f'''/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY.
 * Generated from apps/mobile/assets/body/body-regions.svg
 */

export interface RegionPath {{
  id: string;
  d: string;
}}

export interface BodyRegionsDefinition {{
  width: number;
  height: number;
  regions: Record<string, RegionPath[]>;
}}

export const BODY_REGIONS: BodyRegionsDefinition = {{
  width: {width},
  height: {height},
  regions: {regions_json},
}};

export default BODY_REGIONS;
'''

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)

    print(f"Generated {out_path} ({len(ts_content)} bytes)")

if __name__ == '__main__':
    generate_body_regions()
