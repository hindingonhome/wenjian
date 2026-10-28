"""Build WenJian's outlined glyph mark and losslessly recompressed local fonts."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
import hashlib,json

root=Path(__file__).resolve().parent.parent
fonts=root/'assets/fonts'
receipts=[row for row in json.loads((fonts/'sources.json').read_text(encoding='utf-8')) if not row['file'].startswith('GenSenRounded')]
for weight in ('Regular','Bold'):
    suffix={'Regular':'R','Bold':'B'}[weight]
    source=root/'.growth-atlas-build/tools/font-sources'/f'GenSenRounded2TW-{suffix}.otf'
    font=TTFont(source)
    font.flavor='woff2'
    target=fonts/f'GenSenRounded-{weight}.woff2'
    font.save(target)
    receipts.append({'file':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'source':f'https://github.com/ButTaiwan/gensen-font/blob/master/otf/TW/{source.name}','sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'copyright':font['name'].getDebugName(0),'version':font['name'].getDebugName(5)})
    if weight=='Bold':
        glyphs=font.getGlyphSet();glyph=glyphs[font.getBestCmap()[ord('纹')]]
        pen=SVGPathPen(glyphs);glyph.draw(pen)
        bounds=BoundsPen(glyphs);glyph.draw(bounds);x0,y0,x1,y1=bounds.bounds
        scale=min(208/(x1-x0),208/(y1-y0))
        tx=128-(x0+x1)/2*scale;ty=128+(y0+y1)/2*scale
        shape=f'<path transform="translate({tx:.5f} {ty:.5f}) scale({scale:.7f} {-scale:.7f})" d="{pen.getCommands()}"/>'
        glyph_svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">{shape}</svg>'
        (root/'assets/brand-mark.svg').write_text(glyph_svg.replace('fill="currentColor"','fill="#0066cc"'),encoding='utf-8')
        tile=f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 256 256"><rect width="256" height="256" rx="56" fill="#f5f5f7"/><g fill="#0066cc">{shape}</g></svg>'
        (root/'desktop/icon.svg').write_text(tile,encoding='utf-8')
        html=(root/'index.html').read_text(encoding='utf-8')
        import re
        html=re.sub(r'(<span class="brand-mark" aria-hidden="true">).*?(</span>)',lambda m:m[1]+glyph_svg+m[2],html,count=1,flags=re.S)
        (root/'index.html').write_text(html,encoding='utf-8')
(fonts/'sources.json').write_text(json.dumps(receipts,ensure_ascii=False,indent=2),encoding='utf-8')
print('Built rounded glyph mark and full GenSen WOFF2 fonts; OFL retained.')
