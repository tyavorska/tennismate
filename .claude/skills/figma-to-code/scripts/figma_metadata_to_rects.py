#!/usr/bin/env python3
"""Flatten Figma `get_metadata` output into absolute rectangles for a pixel diff.

Usage:
  python3 -I figma_metadata_to_rects.py <metadata-file> [--root-id 7:14] [--texts-only]

<metadata-file> is the saved tool result: either the raw XML-like text or the JSON
wrapper ([{"type":"text","text":"<frame ...>"}]) that large results are saved as.
Child coordinates in the metadata are relative to their parent; this script adds
them up so every row is relative to the root frame's top-left corner.
Output: a JSON array of {id, name, type, x, y, w, h, depth}. For text nodes `name`
is the text itself, which is what the browser side matches on.
"""
import argparse
import json
import sys
import xml.etree.ElementTree as ET


def load_xml(path):
    raw = open(path, encoding="utf-8").read()
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            raw = "".join(item.get("text", "") for item in data if isinstance(item, dict))
    except json.JSONDecodeError:
        pass
    return raw[raw.index("<"): raw.rindex(">") + 1]


def number(node, key):
    return float(node.attrib.get(key, "0"))


def walk(node, origin_x, origin_y, depth, rows):
    x = origin_x + number(node, "x")
    y = origin_y + number(node, "y")
    rows.append(
        {
            "id": node.attrib.get("id", ""),
            "name": node.attrib.get("name", ""),
            "type": node.tag,
            "x": round(x, 1),
            "y": round(y, 1),
            "w": round(number(node, "width"), 1),
            "h": round(number(node, "height"), 1),
            "depth": depth,
        }
    )
    for child in node:
        walk(child, x, y, depth + 1, rows)


def find(node, node_id):
    if node.attrib.get("id") == node_id:
        return node
    for child in node:
        hit = find(child, node_id)
        if hit is not None:
            return hit
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    parser.add_argument("--root-id")
    parser.add_argument("--texts-only", action="store_true")
    args = parser.parse_args()

    root = ET.fromstring(load_xml(args.path))
    if args.root_id:
        root = find(root, args.root_id)
        if root is None:
            sys.exit(f"no node with id {args.root_id}")

    rows = []
    # The chosen root becomes the origin, so its own x and y are ignored.
    root_rows = []
    walk(root, -number(root, "x"), -number(root, "y"), 0, root_rows)
    rows = [r for r in root_rows if not args.texts_only or r["type"] == "text"]
    json.dump(rows, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
