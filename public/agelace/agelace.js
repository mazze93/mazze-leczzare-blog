// agelace on the spine: the lamp (daylight / candle, remembered per viewer),
// The page reads and works without it.
(() => {
  const root = document.documentElement;
  const KEY = "agelace-spine-lamp";
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch { /* private mode */ } };
  const dark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const saved = read();
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;

  const button = document.querySelector(".lamp-toggle");
  const label = () => { if (button) button.textContent = dark() ? "Lamp: candle" : "Lamp: daylight"; };
  label();
  button?.addEventListener("click", () => {
    const next = dark() ? "light" : "dark";
    root.dataset.theme = next;
    write(next);
    label();
  });

})();
