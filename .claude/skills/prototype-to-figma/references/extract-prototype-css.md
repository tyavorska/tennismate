# Extracting one section's CSS from the prototype

The prototype is one large HTML file. Do not read it whole.

1. Locate the markup: `grep -n "Play from any device" docs/design/prototype.html`, then print about 150 lines around the match.
2. Pull the rules for the classes you saw in that markup, including inside `@media`:

```bash
python3 -I - <<'PY'
import re
html = open('docs/design/prototype.html', encoding='utf-8').read()
css = max(re.findall(r'<style[^>]*>(.*?)</style>', html, flags=re.S), key=len)

def blocks(s):
    i = 0
    while i < len(s):
        j = s.find('{', i)
        if j < 0:
            return
        depth, k = 1, j + 1
        while depth and k < len(s):
            depth += (s[k] == '{') - (s[k] == '}')
            k += 1
        yield s[i:j].strip(), s[j + 1:k - 1]
        i = k

pattern = re.compile(r'\.lp-|\.devices|\.dev\b|\.tag\b')   # edit: the classes you found
for selector, body in blocks(css):
    if selector.startswith('@media'):
        inner = [(s, b) for s, b in blocks(body) if pattern.search(s)]
        if inner:
            print(selector, '{')
            for s, b in inner:
                print('  ', s, '{', re.sub(r'\s+', ' ', b).strip(), '}')
            print('}')
    elif pattern.search(selector):
        print(selector, '{', re.sub(r'\s+', ' ', body).strip(), '}')
PY
```

3. Several rules can share a class name for unrelated components (`.dev` exists for the device card and for a calendar chip). Treat the later rule with caution and confirm against a rendered screenshot.
4. The `@media` rules give the breakpoints; list each as `max-width` in px and convert to rem for the code.
