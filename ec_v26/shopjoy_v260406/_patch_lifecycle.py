"""
Ensure onBeforeUnmount, onUnmounted are destructured from Vue when used.
"""
import re
import os

LIFECYCLE_HOOKS = ['onBeforeMount', 'onBeforeUnmount', 'onUnmounted', 'onUpdated', 'onBeforeUpdate', 'onActivated', 'onDeactivated', 'onErrorCaptured', 'nextTick']

JS_FILES = []
for root, dirs, files in os.walk('pages/bo'):
    for fn in files:
        if fn.endswith('.js'):
            JS_FILES.append(os.path.join(root, fn))

def patch_file(f):
    with open(f, 'r', encoding='utf-8') as fh:
        src = fh.read()

    if 'setup(' not in src:
        return None

    # Find Vue destructuring inside setup
    destr = re.search(r'(    const\s*\{)([^}]*)(\}\s*=\s*Vue\s*;)', src)
    if not destr:
        return None

    inner = destr.group(2)
    existing = set([s.strip() for s in inner.split(',') if s.strip()])

    needed = []
    for hook in LIFECYCLE_HOOKS:
        if hook in existing:
            continue
        # Check if hook is called bare in setup body
        bare_pattern = r'(?<![.\w$])' + hook + r'\s*\('
        if re.search(bare_pattern, src):
            needed.append(hook)

    if not needed:
        return None

    new_inner = inner.rstrip().rstrip(',') + ', ' + ', '.join(needed) + ' '
    new_src = src[:destr.start()] + destr.group(1) + ' ' + new_inner.lstrip() + destr.group(3) + src[destr.end():]

    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(new_src)

    return f"[done] {f}: added [{', '.join(needed)}]"


for f in JS_FILES:
    res = patch_file(f)
    if res:
        print(res)
