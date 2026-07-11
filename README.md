# Morf 3.4.3

Morf is a browser-based language and name-building workshop. It combines an Awkwords-style word generator, reusable grapheme patterns, lexicon morphemes, whole-word vocabulary, proper names, a dictionary, and a translator/analyzer.

This package is the full project version. Upload all files together when hosting on GitHub Pages or another static host.

## Files

- `index.html` — the hosted page
- `styles.css` — visual layout and mobile styling
- `tab-switcher.js` — independent tab fallback
- `button-rescue.js` — backup handlers for important buttons
- `morf-core.js` — parser, generator, importer/exporter, analyzer core
- `app.js` — UI rendering and editing logic
- `version-fix.js` — visible build marker
- `morf_3_4_3_standalone.html` — all-in-one backup file

## 3.4.3 notes

- Import now updates the full UI immediately, including Lexicon, Vocabulary, Names, Additional Patterns, and Dictionary.
- Import accepts `.morf`, `.json`, and pasted JSON/settings text.
- Starter data is generic English-style demo data instead of a private conlang.
- The full ZIP includes every project file, not only changed files.

## Basic syntax

- `C`, `V`, `N` etc. reference Additional Patterns or Lexicon category letters.
- `.n.` references a Vocabulary category.
- `..F..` references a Name category.
- `[a/b]` is a required choice.
- `(a/b)` is optional.
- `{2}` and `{1,3}` repeat tokens/groups.
- `<...>` captures generated text and `&1`, `&2`, or `&` repeat captures.
- Rewrite rules use `old=new`.
- Forbidden sequences reject generated words.
- Starts/Contains/Ends are final-output filters. `$text$` can force Starts/Ends by fitting or prepending/appending.

## Hosting

For GitHub Pages, upload the contents of this folder to your repository root and enable Pages from the `main` branch/root folder.
