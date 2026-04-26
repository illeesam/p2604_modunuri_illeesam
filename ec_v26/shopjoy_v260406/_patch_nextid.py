"""
For each BO Dtl/Mng file that calls nextId.value(...) bare,
inject `const nextId = window.nextId;` at top of setup body.
"""
import re
import os

JS_FILES = []
for root, dirs, files in os.walk('pages/bo'):
    for fn in files:
        if fn.endswith('.js'):
            JS_FILES.append(os.path.join(root, fn))

def patch_file(f):
    with open(f, 'r', encoding='utf-8') as fh:
        src = fh.read()

    if 'nextId' not in src:
        return None

    # Skip if already has nextId binding
    if re.search(r'\bconst\s+nextId\s*=', src):
        return None

    # Find first const after setup() opening
    m = re.search(r'(setup\s*\([^)]*\)\s*\{\s*\n)(    const\s)', src)
    if not m:
        return None
    insert_pos = m.start(2)
    binding = "    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };\n"
    new_src = src[:insert_pos] + binding + src[insert_pos:]

    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(new_src)

    return f"[done] {f}"


for f in JS_FILES:
    res = patch_file(f)
    if res:
        print(res)
