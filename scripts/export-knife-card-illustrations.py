"""Extract individual knife artwork, excluding number labels, cross-section insets and other knives.
Run with svgpathtools installed: python3 scripts/export-knife-card-illustrations.py
The source SVG's existing selection rectangles identify each knife. Only complete
artwork elements whose geometric centres fall in that rectangle are copied.
"""
import copy
from pathlib import Path
import xml.etree.ElementTree as ET
from svgpathtools import parse_path, parse_transform
from svgpathtools.path import transform
from svgpathtools import svg_to_paths

ROOT = Path(__file__).resolve().parent.parent
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
source = ET.parse(ROOT / 'assets/knife_real2.svg').getroot()
artwork = source.find(f"{{{NS}}}g[@id='knife-real-artwork']")
style = source.find(f'{{{NS}}}defs/{{{NS}}}style')
folder = ROOT / 'assets/knife-cards'
folder.mkdir(exist_ok=True)
elements = []
for element in artwork:
    if element.get('class') == 'cls-1':  # Filled outlines are the printed numbers.
        continue
    tag = element.tag.rsplit('}', 1)[-1]
    if tag == 'rect' and element.get('transform'):
        continue  # Two detached blade-thickness insets above deba/ai-deba.
    path = parse_path(getattr(svg_to_paths, tag + '2pathd')(element))
    if element.get('transform'):
        path = transform(path, parse_transform(element.get('transform')))
    elements.append((element, path.bbox()))
assigned = set()
illustrations = []
for number in range(1, 26):
    rect = source.find(f"{{{NS}}}defs/{{{NS}}}clipPath[@id='knife-clip-{number}']/{{{NS}}}rect")
    x, y, width, height = (float(rect.get(key)) for key in ['x', 'y', 'width', 'height'])
    selected = [(element, bounds) for element, bounds in elements
                if x <= (bounds[0] + bounds[1]) / 2 < x + width
                and y <= (bounds[2] + bounds[3]) / 2 < y + height]
    assert selected, f'No artwork found for knife {number}'
    assert not any(id(element) in assigned for element, _ in selected), 'Ambiguous source selection'
    assigned.update(id(element) for element, _ in selected)
    left = min(bounds[0] for _, bounds in selected) - 6
    right = max(bounds[1] for _, bounds in selected) + 6
    top = min(bounds[2] for _, bounds in selected) - 6
    bottom = max(bounds[3] for _, bounds in selected) + 6
    # Rotate 90 degrees clockwise, then mirror horizontally: x' = y, y' = x.
    svg = ET.Element(f'{{{NS}}}svg', {'viewBox': f'{top:g} {left:g} {bottom-top:g} {right-left:g}',
                                    'role': 'img', 'aria-labelledby': 'title'})
    ET.SubElement(svg, f'{{{NS}}}title', {'id': 'title'}).text = f'Knife {number}'
    defs = ET.SubElement(svg, f'{{{NS}}}defs')
    defs.append(copy.deepcopy(style))
    group = ET.SubElement(svg, f'{{{NS}}}g', {'id': f'knife-{number}', 'transform': 'matrix(0 1 1 0 0 0)'})
    for element, _ in selected:
        group.append(copy.deepcopy(element))
    illustrations.append((number, svg, top, left, bottom - top, right - left))
assert len(assigned) == len(elements), 'Unassigned knife artwork remains'
print(f'Extracted 25 knives: {len(assigned)} artwork elements; no number labels or other knives.')

# Use one source-unit scale throughout the deck, retaining relative knife sizes
# and stroke weights. Bottom alignment keeps the vocabulary gap consistent.
canvas_width = max(item[4] for item in illustrations)
canvas_height = max(item[5] for item in illustrations)
for number, svg, x, y, width, height in illustrations:
    svg.set('viewBox', f'{x - (canvas_width - width) / 2:g} {y + height - canvas_height:g} {canvas_width:g} {canvas_height:g}')
    ET.ElementTree(svg).write(folder / f'knife-{number:02}.svg', encoding='utf-8', xml_declaration=True)
