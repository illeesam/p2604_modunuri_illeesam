"""
For each BO Dtl file using memoEl in template/return but not defined as ref,
inject `const memoEl = ref(null);` and watch sync to uiState.memoEl just before return statement.
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

    if 'memoEl' not in src:
        return None
    if 'setup(' not in src:
        return None
    # already has top-level memoEl ref?
    if re.search(r'\bconst\s+memoEl\s*=\s*ref\(', src):
        return None

    # Locate "    return {" (4-space indent) at top level of setup
    m = re.search(r'\n    return\s*\{', src)
    if not m:
        return None
    insert_pos = m.start() + 1  # after newline
    block = "    const memoEl = Vue.ref(null);\n    Vue.watch(memoEl, (el) => { if (uiState) uiState.memoEl = el; });\n"
    new_src = src[:insert_pos] + block + src[insert_pos:]

    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(new_src)

    return f"[done] {f}"


for f in JS_FILES:
    res = patch_file(f)
    if res:
        print(res)
