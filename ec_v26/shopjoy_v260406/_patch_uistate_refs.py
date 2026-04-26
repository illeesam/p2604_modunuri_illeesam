"""
For each BO file:
- Find all bare identifiers used in template that aren't defined in setup
  but exist as keys in uiState reactive object.
- Inject Vue.toRef(uiState, 'X') bindings just before return statement.
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

    if 'setup(' not in src:
        return None

    # Find uiState reactive object literal and extract its keys
    m = re.search(r'const\s+uiState\s*=\s*reactive\(\s*\{([^}]*)\}\s*\)', src, re.DOTALL)
    if not m:
        return None

    state_block = m.group(1)
    # extract keys: word followed by ":"
    keys = set(re.findall(r'(\w+)\s*:', state_block))

    # Find template part
    tpl_match = re.search(r'template\s*:\s*[/`]', src)
    if not tpl_match:
        return None
    tpl = src[tpl_match.start():]

    # Find return object
    ret_match = re.search(r'\n    return\s*\{([^}]+)\}', src[:tpl_match.start()], re.DOTALL)
    if not ret_match:
        return None
    return_content = ret_match.group(1)
    return_idents = set(re.findall(r'(?:^|\s|,)(\w+)\s*(?:,|$|:)', return_content))

    # Identify uiState keys referenced bare in template but not as defined consts
    needs = set()
    for k in keys:
        if k in ('loading', 'error', 'isPageCodeLoad', 'descOpen'): continue
        # is k defined as const in setup body?
        setup_part = src[:tpl_match.start()]
        if re.search(r'\bconst\s+' + k + r'\s*=', setup_part):
            continue
        # is k used bare in template?
        bare_in_tpl = re.search(r'(?<![.\w$])' + k + r'(?![\w$])', tpl)
        if bare_in_tpl:
            needs.add(k)
        # also if k is in return list (since return references trigger ref errors)
        if re.search(r'(?:^|\s|,|\{)' + k + r'(?:\s*,|\s*\}|\s*$)', return_content):
            needs.add(k)

    if not needs:
        return None

    # Insert before "    return {"
    rmatch = re.search(r'\n    return\s*\{', src)
    if not rmatch:
        return None
    insert_pos = rmatch.start() + 1
    bindings = []
    for k in sorted(needs):
        bindings.append(f"    const {k} = Vue.toRef(uiState, '{k}');")
    block = '\n'.join(bindings) + '\n'
    new_src = src[:insert_pos] + block + src[insert_pos:]

    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(new_src)

    return f"[done] {f}: added {sorted(needs)}"


for f in JS_FILES:
    try:
        res = patch_file(f)
        if res:
            print(res)
    except Exception as e:
        print(f"[err] {f}: {e}")
