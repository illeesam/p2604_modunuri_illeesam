"""
Patch BO Dtl files: inject Vue.toRef bindings for tab/activeTab/topTab/viewMode2/previewMode
when those identifiers are referenced bare but not defined in setup().
Also ensures onUnmounted is destructured from Vue when used.
"""
import re
import os
import sys

DTL_FILES = []
for root, dirs, files in os.walk('pages/bo'):
    for fn in files:
        if fn.endswith('.js'):
            DTL_FILES.append(os.path.join(root, fn))

IDENTIFIERS = ['tab', 'activeTab', 'topTab', 'viewMode2', 'previewMode']

def patch_file(f):
    with open(f, 'r', encoding='utf-8') as fh:
        src = fh.read()

    # Skip if no Vue setup function
    if 'setup(' not in src:
        return None

    needs = []
    for ident in IDENTIFIERS:
        # Look for identifier defined as a const in setup
        defined = re.search(r'\bconst\s+' + ident + r'\s*=', src)
        if defined:
            continue
        # Check if identifier referenced bare (not preceded by . or word char)
        # Look in template (after `template:` ) and in return statements
        # Use simple heuristic: identifier appears bare somewhere
        bare_pattern = r'(?<![.\w$])' + ident + r'(?![\w$])'
        # check usage outside of "uiState.X" and outside of definitions
        # Exclude appearance in 'in uiState' check, etc.
        if re.search(bare_pattern, src):
            # Also verify it's used as bare reference, not just inside string
            # Quick filter: ignore comments
            uses = re.findall(bare_pattern, src)
            if len(uses) > 0:
                needs.append(ident)

    if not needs:
        return None

    # Find first uiState reactive line; inject bindings AFTER it
    m = re.search(r'(    const uiState\s*=\s*reactive\([^)]*?\}\s*\)\s*;[^\n]*\n)', src, re.DOTALL)
    if not m:
        return f"[skip] no uiState reactive: {f}"

    insert_pos = m.end()

    bindings = []
    for ident in needs:
        # Use Vue.toRef to bind to uiState. If uiState doesn't have this property,
        # toRef still creates a ref that reads/writes to that key (just initially undefined).
        bindings.append(f"    const {ident} = Vue.toRef(uiState, '{ident}');")
    binding_block = '\n'.join(bindings) + '\n'
    new_src = src[:insert_pos] + binding_block + src[insert_pos:]

    # Ensure onUnmounted is destructured if used
    if 'onUnmounted(' in new_src:
        # Find Vue destructuring in setup
        destr = re.search(r'(const\s*\{)([^}]*)(\}\s*=\s*Vue\s*;)', new_src)
        if destr and 'onUnmounted' not in destr.group(2):
            inner = destr.group(2).rstrip().rstrip(',') + ', onUnmounted '
            new_src = new_src[:destr.start()] + destr.group(1) + ' ' + inner.lstrip() + ' ' + destr.group(3) + new_src[destr.end():]

    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(new_src)

    return f"[done] {f}: added [{', '.join(needs)}]"


for f in DTL_FILES:
    res = patch_file(f)
    if res:
        print(res)
