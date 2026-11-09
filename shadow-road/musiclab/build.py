# Bundles the lab into one self-contained page (music.js inlined) at the path given as the first argument.
import re, sys, pathlib
here = pathlib.Path(__file__).parent
html = (here / 'index.html').read_text()
for src in re.findall(r'<script src="([^"]+)"></script>', html):
    code = (here / src).read_text()
    assert '</script' not in code
    html = html.replace(f'<script src="{src}"></script>', f'<script>\n{code}\n</script>')
html = re.sub(r'<!doctype html>\s*<html[^>]*>\s*<head>', '', html)
html = re.sub(r'<meta charset[^>]*>\s*<meta name="viewport"[^>]*>\s*', '', html)
html = re.sub(r'</head>\s*<body>', '', html)
html = re.sub(r'</body>\s*</html>\s*$', '', html)
pathlib.Path(sys.argv[1]).write_text(html)
