// shot.cjs — render an SVG file in real Chromium and save a PNG.
// usage: node shot.cjs <in.svg> <out.png> <w> <h>
const { chromium } = require('/home/claude/mazze93/mazze-leczzare-blog/node_modules/playwright');
(async () => {
  const [, , inp, out, w, h] = process.argv;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  await page.goto('file://' + require('path').resolve(inp));
  await page.screenshot({ path: out });
  await browser.close();
})();
