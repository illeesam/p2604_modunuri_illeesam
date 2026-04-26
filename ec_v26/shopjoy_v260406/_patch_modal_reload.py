"""
Patch all modal components in components/modals/BaseModal.js and pages/bo/BoModals.js
to add `reloadTrigger` prop and watch which calls fetch function.

Detects fetch function name from `onMounted(() => { fnName(); })` or
`onMounted(fnName)` patterns.
"""
import re

TARGETS = [
    'components/modals/BaseModal.js',
    'pages/bo/BoModals.js',
]

# Pattern: onMounted(() => { fnName(); }); OR onMounted(fnName);
# Or with await: onMounted(async () => { await fnName(); });
ON_MOUNTED_PATTERNS = [
    re.compile(r'onMounted\(\s*\(\s*\)\s*=>\s*\{\s*(?:await\s+)?(\w+)\s*\(\s*\)\s*;?\s*\}\s*\)\s*;'),
    re.compile(r'onMounted\(\s*async\s*\(\s*\)\s*=>\s*\{\s*await\s+(\w+)\s*\(\s*\)\s*;?\s*\}\s*\)\s*;'),
    re.compile(r'onMounted\(\s*(\w+)\s*\)\s*;'),
    re.compile(r'Vue\.onMounted\(\s*\(\s*\)\s*=>\s*\{\s*(?:await\s+)?(\w+)\s*\(\s*\)\s*;?\s*\}\s*\)\s*;'),
    re.compile(r'Vue\.onMounted\(\s*(\w+)\s*\)\s*;'),
]

def patch_component(comp_text, comp_name):
    """Patch a single component's setup() block. Returns updated text or None."""
    # Find fetch function name
    fetch_fn = None
    for pat in ON_MOUNTED_PATTERNS:
        m = pat.search(comp_text)
        if m:
            fetch_fn = m.group(1)
            break

    # Find props: declaration to add reloadTrigger
    props_match = re.search(r"props\s*:\s*(\[[^\]]*\]|\{[^}]*\})", comp_text)
    if not props_match:
        return None

    props_text = props_match.group(1)
    if 'reloadTrigger' in props_text:
        return None  # already has it

    # Add reloadTrigger
    if props_text.startswith('['):
        # Array form
        new_props = props_text.rstrip(']').rstrip()
        if new_props.endswith('['):
            new_props += "'reloadTrigger']"
        else:
            new_props += ", 'reloadTrigger']"
    else:
        # Object form: { foo: ..., bar: ... }
        new_props = props_text.rstrip('}').rstrip()
        if new_props.endswith(','):
            new_props += " reloadTrigger: { type: Number, default: 0 } }"
        elif new_props.endswith('{'):
            new_props += " reloadTrigger: { type: Number, default: 0 } }"
        else:
            new_props += ", reloadTrigger: { type: Number, default: 0 } }"

    new_text = comp_text[:props_match.start(1)] + new_props + comp_text[props_match.end(1):]

    # Add watch after onMounted if fetch_fn found
    if fetch_fn:
        # Find onMounted line and inject watch after it
        # Use the first match again on new_text
        for pat in ON_MOUNTED_PATTERNS:
            m = pat.search(new_text)
            if m:
                # Insert watch right after the onMounted statement
                insert_pos = m.end()
                # Detect indentation
                line_start = new_text.rfind('\n', 0, m.start()) + 1
                indent = new_text[line_start:m.start()]
                vue_prefix = 'Vue.' if m.group(0).startswith('Vue.') else ''
                watch_line = f"\n{indent}{vue_prefix}watch(() => props.reloadTrigger, () => {{ if (props.reloadTrigger) {fetch_fn}(); }});"
                new_text = new_text[:insert_pos] + watch_line + new_text[insert_pos:]
                break

    return new_text


def patch_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read()

    # Find all top-level component definitions
    # Pattern: window.XxxModal = { ... };
    # We'll iterate through them
    comp_pattern = re.compile(r'(window\.\w*(?:Modal|TreeNode|Postman|LoginHist|Selector)\s*=\s*\{)', re.MULTILINE)
    matches = list(comp_pattern.finditer(src))
    if not matches:
        return None

    # Process from end to start to keep positions valid
    new_src = src
    patched_count = 0
    for m in reversed(matches):
        start = m.start()
        # Find matching closing brace - simple approach: scan for };
        # Track brace depth
        i = m.end() - 1  # position of opening {
        depth = 1
        i += 1
        while i < len(new_src) and depth > 0:
            ch = new_src[i]
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    break
            elif ch == '"' or ch == "'" or ch == '`':
                # Skip string
                quote = ch
                i += 1
                while i < len(new_src):
                    if new_src[i] == '\\':
                        i += 2
                        continue
                    if new_src[i] == quote:
                        break
                    if quote == '`' and new_src[i:i+2] == '${':
                        # Skip template literal expression - simplified
                        depth_inner = 1
                        i += 2
                        while i < len(new_src) and depth_inner > 0:
                            if new_src[i] == '{': depth_inner += 1
                            elif new_src[i] == '}': depth_inner -= 1
                            i += 1
                        continue
                    i += 1
            elif ch == '/' and i+1 < len(new_src) and new_src[i+1] == '/':
                # line comment
                while i < len(new_src) and new_src[i] != '\n':
                    i += 1
            elif ch == '/' and i+1 < len(new_src) and new_src[i+1] == '*':
                i += 2
                while i+1 < len(new_src) and not (new_src[i] == '*' and new_src[i+1] == '/'):
                    i += 1
                i += 2
                continue
            i += 1
        if depth != 0:
            continue
        end = i + 1  # include closing }

        comp_text = new_src[start:end]
        comp_name_match = re.match(r'window\.(\w+)', comp_text)
        comp_name = comp_name_match.group(1) if comp_name_match else '?'

        patched = patch_component(comp_text, comp_name)
        if patched:
            new_src = new_src[:start] + patched + new_src[end:]
            patched_count += 1

    if patched_count == 0:
        return None

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_src)
    return patched_count


for p in TARGETS:
    n = patch_file(p)
    if n:
        print(f"[done] {p}: patched {n} components")
    else:
        print(f"[skip] {p}: nothing to patch")
