"""
Ensure ref, reactive, computed, watch, onMounted, onUnmounted, onBeforeMount,
onBeforeUnmount, nextTick are destructured from Vue if used in setup body.
"""
import re
import os

ALL_VUE = ['ref','reactive','computed','watch','watchEffect','onMounted','onUnmounted','onBeforeMount','onBeforeUnmount','onUpdated','onBeforeUpdate','onActivated','onDeactivated','onErrorCaptured','nextTick','toRef','toRefs','readonly','isRef','unref','provide','inject']

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

    destr = re.search(r'(    const\s*\{)([^}]*)(\}\s*=\s*Vue\s*;)', src)
    if not destr:
        return None
    inner = destr.group(2)
    existing = set([s.strip() for s in inner.split(',') if s.strip()])

    needed = []
    for hook in ALL_VUE:
        if hook in existing:
            continue
        # is hook used bare (not Vue.hook) in setup body?
        bare = re.search(r'(?<![.\w$])' + hook + r'\s*\(', src)
        if bare:
            needed.append(hook)

    if not needed:
        return None
    new_inner = inner.rstrip().rstrip(',') + ', ' + ', '.join(needed) + ' '
    new_src = src[:destr.start()] + destr.group(1) + ' ' + new_inner.lstrip() + destr.group(3) + src[destr.end():]
    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(new_src)
    return f"[done] {f}: added {needed}"

for f in JS_FILES:
    res = patch_file(f)
    if res:
        print(res)
