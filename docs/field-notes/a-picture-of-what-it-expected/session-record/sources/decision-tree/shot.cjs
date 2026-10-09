const { chromium } = require('/home/claude/mazze93/mazze-leczzare-blog/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [name, w, h] of [['desk', 1280, 820], ['phone', 390, 844]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.goto('file://' + process.cwd() + '/tree-of-the-measure.html');
    await p.click('#descend'); await p.click('#nd-dummy').catch(() => {});
    await p.locator('.nd-wrap').nth(5).click(); await p.waitForTimeout(600);
    await p.screenshot({ path: `look-${name}.png`, fullPage: name === 'phone' });
    await p.close();
  }
  await b.close(); console.log(errs.length ? errs.join('\n') : 'no page errors');
})();
