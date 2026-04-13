# ACCESSIBILITY-FIRST DESIGN RULES
## Critical constraints I must follow for every HTML/CSS deliverable

---

## WCAG AA MINIMUM REQUIREMENTS (NON-NEGOTIABLE)

### Text Contrast Ratios
- **Normal text (< 18pt):** Minimum 4.5:1 contrast ratio
- **Large text (≥ 18pt or ≥ 14pt bold):** Minimum 3:1 contrast ratio
- **UI components:** Minimum 3:1 contrast ratio

### NEVER USE THESE COLOR COMBINATIONS

❌ **FORBIDDEN - These fail WCAG AA:**
```css
/* Light gray on dark gray - INVISIBLE */
color: #8a9890; /* on */ background: #0f1210;  /* 2.8:1 - FAILS */
color: #506058; /* on */ background: #0f1210;  /* 1.9:1 - FAILS BADLY */

/* Medium gray on white - FAINT */
color: #c8cec8; /* on */ background: #ffffff;  /* 2.1:1 - FAILS */

/* Muted teal on dark - BARELY VISIBLE */
color: #3ab8a0; /* on */ background: #0f1210;  /* 3.2:1 - FAILS for body text */
```

### ✅ SAFE COLOR COMBINATIONS

**For dark backgrounds (#0f1210 / #1a1f1c):**
```css
/* Body text */
color: #f2f4f0;  /* White - 14.2:1 ✓ PASS */
color: #e8ece8;  /* Off-white - 12.8:1 ✓ PASS */

/* Secondary text */
color: #c5cfc8;  /* Light gray - 8.1:1 ✓ PASS */

/* Accent colors */
color: #4fd1ba;  /* Bright teal - 6.8:1 ✓ PASS */
color: #ff8f6f;  /* Bright coral - 5.2:1 ✓ PASS */

/* Labels/metadata (can be slightly dimmer) */
color: #9aa59d;  /* Medium gray - 4.6:1 ✓ PASS (minimum) */
```

**For light backgrounds (#ffffff / #f5f5f5):**
```css
/* Body text */
color: #1a1f1c;  /* Dark - 15.1:1 ✓ PASS */
color: #2a2f2c;  /* Charcoal - 12.4:1 ✓ PASS */

/* Secondary text */
color: #3a4540;  /* Dark gray - 7.8:1 ✓ PASS */

/* Links/accents */
color: #2a8070;  /* Dark teal - 4.7:1 ✓ PASS */
color: #c04530;  /* Dark coral - 5.1:1 ✓ PASS */
```

---

## DESIGN PATTERNS I MUST AVOID

### ❌ NEVER DO THIS:

**1. Subtle gray-on-gray schemes**
```css
/* This looks "sophisticated" but is INACCESSIBLE */
.card {
  background: #1a1f1c;
  color: #506058; /* INVISIBLE to many users */
}
```

**2. Low-contrast "elegant" aesthetics**
```css
/* Fashion-forward ≠ readable */
.minimal-design {
  background: #f5f5f5;
  color: #d0d0d0; /* FAILS WCAG */
}
```

**3. Relying on color alone for meaning**
```css
/* Must have text labels or icons, not just color */
.status-green { color: #00ff00; } /* ❌ Colorblind users can't distinguish */
```

**4. Tiny faint labels**
```css
/* Small + low contrast = double failure */
.metadata {
  font-size: 0.7rem;
  color: #8a9890; /* ❌ Too dim */
}
```

---

## ✅ ACCESSIBLE PATTERNS TO USE

### Pattern 1: High-Contrast Dark Mode
```css
:root {
  --bg-primary: #0f1210;
  --bg-secondary: #1a1f1c;
  --text-primary: #f2f4f0;    /* 14.2:1 */
  --text-secondary: #c5cfc8;  /* 8.1:1 */
  --text-tertiary: #9aa59d;   /* 4.6:1 - minimum */
  --accent-teal: #4fd1ba;     /* 6.8:1 */
  --accent-coral: #ff8f6f;    /* 5.2:1 */
}
```

### Pattern 2: Clear Visual Hierarchy
```css
/* Headings: Always high contrast */
h1, h2, h3 {
  color: #f2f4f0; /* Not #8a9890 */
}

/* Body: High contrast */
p {
  color: #f2f4f0; /* Not #c8cec8 */
}

/* Metadata: Still readable */
.meta {
  color: #c5cfc8; /* Not #506058 */
}
```

### Pattern 3: Interactive Elements
```css
/* Links must be clearly visible */
a {
  color: #4fd1ba;  /* Bright enough */
  text-decoration: underline; /* Don't rely on color alone */
}

a:hover {
  color: #6fe5d0; /* Even brighter on hover */
}

/* Buttons must have sufficient contrast */
button {
  background: #4fd1ba;
  color: #0f1210; /* Dark on light = 10.1:1 */
}
```

---

## TESTING CHECKLIST

Before delivering ANY HTML/CSS, I must verify:

- [ ] Run colors through WebAIM contrast checker: https://webaim.org/resources/contrastchecker/
- [ ] Body text contrast ≥ 4.5:1
- [ ] Headings contrast ≥ 4.5:1
- [ ] Interactive elements contrast ≥ 3:1
- [ ] Small text (< 14px) has ≥ 4.5:1
- [ ] Test in browser with zoom at 200%
- [ ] Test with grayscale filter (simulates colorblindness)
- [ ] Squint test: Can I still read the text?

---

## ANTI-PATTERN RECOGNITION

If I catch myself writing ANY of these, STOP and fix:

```css
/* ❌ DANGER SIGNS */
color: #[5-8][0-9a-f]{5};  /* Mid-range grays are usually too dim */
opacity: 0.[1-5];           /* Making already-dim colors transparent */
color: rgba(..., 0.[1-5]);  /* Same problem */
```

**Rule:** If hex value starts with 5, 6, 7, or 8, it's probably too dim for text on dark backgrounds.

---

## HUMAN-FRIENDLY ADJUSTMENTS

### ✅ Make Colors Easy to Modify

**DO THIS:**
```css
:root {
  /* Named, semantic, easy to find and change */
  --text-primary: #f2f4f0;
  --text-secondary: #c5cfc8;
}

h1 { color: var(--text-primary); }
p { color: var(--text-primary); }
```

**NOT THIS:**
```css
/* Scattered, hard to find, inconsistent */
h1 { color: #f2f4f0; }
p { color: #e8ece8; }
.card p { color: rgba(242, 244, 240, 0.9); }
```

### ✅ Don't Use Background Bars as Bandaids

**BAD FIX:**
```css
/* This is what the user specifically said NOT to do */
.text {
  color: #8a9890; /* Still too dim */
  background: rgba(255, 255, 255, 0.1); /* Bandaid */
}
```

**GOOD FIX:**
```css
/* Just make the text color right in the first place */
.text {
  color: #c5cfc8; /* Readable, no background needed */
}
```

---

## PDF EXPORT CONSIDERATION

Colors that look "okay" on screen often become INVISIBLE in PDFs.

**Safe for PDF export:**
- Pure white or near-white (#f2f4f0+) on dark
- Pure black or near-black (#1a1f1c or darker) on light
- Avoid: Anything in the #7-#c range

**Test:** If I export to PDF and text disappears or becomes faint gray-on-white, the original colors were TOO DIM.

---

## COMMITMENT

From now on, EVERY deliverable I create will:
1. Use WCAG AA compliant colors
2. Have clearly defined, modifiable color variables
3. Never rely on subtle contrast for readability
4. Be tested at the design stage, not after user feedback

**Default text on dark backgrounds: `#f2f4f0` minimum**
**Default text on light backgrounds: `#1a1f1c` minimum**

No exceptions. Accessibility is not negotiable.
