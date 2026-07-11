# Morf 3.4.5 compatibility fix

Morf is a language-building workshop for generating words, storing morphemes and vocabulary, analyzing forms, and building names for conlangs, worldbuilding, fiction, games, and naming systems.

## What is in this full ZIP

Upload the full contents together when hosting on GitHub Pages or another static host:

- `index.html`
- `styles-3-4-5.css`
- `tab-switcher-3-4-5.js`
- `morf-core-3-4-5.js`
- `button-rescue-3-4-5.js`
- `app-3-4-5.js`
- `version-fix-3-4-5.js`
- legacy aliases: `styles.css`, `tab-switcher.js`, `morf-core.js`, `button-rescue.js`, `app.js`, `version-fix.js`
- `morf_3_4_5_standalone.html`

The `index.html` intentionally references the versioned JS/CSS filenames. That avoids browsers loading an older cached `app.js`, which was likely why the site still showed Version 3.4.3 and kept throwing `addNameCategory` errors.

## Fixes in 3.4.5

- Uses versioned script filenames to avoid stale browser/GitHub cache problems.
- Exposes `addNameCategory` safely for older inline button calls.
- Keeps a rescue implementation of the Names category button even if the main app script fails.
- Improves old Morf v2 compatibility: imports without Names no longer crash or require a Names section.
- Keeps the visible page version at `Version 3.4.5`.
- Full ZIP includes every project file, not only changed files.

## Quick test

1. Upload all files to your GitHub Pages repo root.
2. Open the site and check that the top says `Version 3.4.5`.
3. Try `CV` in the generator.
4. Import an old `.morf` or `.json` file.
5. Check Lexicon, Vocabulary, Additional patterns, Names, and Dictionary.

