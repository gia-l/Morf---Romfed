# Morf 3.5.1

Morf is a browser-based language workshop for creating words, names, derivations, meanings, and dictionary entries in one connected place. It can be used for constructed languages, worldbuilding, fantasy and sci-fi names, tabletop settings, fictional cultures, naming systems, or any project where you want words to feel like they came from the same language.

This package is a full static website. Upload all files together to GitHub Pages or another static host.

## Files

- `index.html` - main website file
- `styles.css` and `styles-3-5.css` - styling
- `morf-core.js` and `morf-core-3-5.js` - parser, generator, analyzer, import/export logic
- `app.js` and `app-3-5.js` - user interface logic
- `tab-switcher.js` and `tab-switcher-3-5.js` - tab fallback logic
- `button-rescue.js` and `button-rescue-3-5.js` - backup button handlers
- `version-fix.js` and `version-fix-3-5.js` - visible version label
- `morf_3_5_standalone.html` - single-file backup version

The `index.html` uses the versioned `3-5` filenames to avoid browsers loading older cached code.

## What's new in 3.5

Version 3.5.1 refines the Names syntax without changing the rest of Morf's syntax.

### Name source units and nicknames

In Names entries, a comma inside a name unit means the forms after it are nicknames:

```text
Isabella, Izzy/Issy = example personal name
```

This means `Isabella` is the source name, and `Izzy` and `Issy` are nicknames.

A top-level slash before a nickname comma creates another source name with the same meaning:

```text
[Isabella, Izzy]/Issy = example personal name
```

This means `Isabella` has nickname `Izzy`, while `Issy` is a related source name with the same meaning, not a nickname.

Brackets group complex name units:

```text
[Elizabeth,Lizzy,Liz/Lizz]/[[Elisabeth/Elsabet],Elsa] = example personal name
```

This creates:

- `Elizabeth` with nicknames `Lizzy`, `Liz`, and `Lizz`
- `Elisabeth` / `Elsabet` with nickname `Elsa`

### Spelling variation syntax still works

Use brackets or parentheses inside a name to create spelling variants:

```text
Jord[a/y]n = river-name
Carolin(e) = example name
```

`Jord[a/y]n` expands to `Jordan` and `Jordyn`.
`Carolin(e)` expands to `Carolin` and `Caroline`.

## Core Morf systems

### Additional Patterns

Additional Patterns are reusable sound or spelling patterns, usually letter variables such as `C` and `V`.

```text
C = p/t/k/m/n/s/l/r
V = a/e/i/o/u
```

You can use them in generator patterns like:

```text
CVCV
```

### Lexicon

Lexicon entries are morphemes: prefixes, roots, suffixes, stems, particles, infixes, or other word-building pieces. Each category has a letter code that can be used in generator patterns.

Example:

```text
pre = before
sil = bird
less = without
```

Lexicon categories have placement rules such as start, middle, end, or anywhere. They can also apply to words, names, or both.

### Vocabulary

Vocabulary entries are whole words. They use dot variables in generator patterns:

```text
.n.
```

A noun category with variable `n` can supply whole vocabulary words.

### Names

Names are proper nouns with their own categories and double-dot variables:

```text
..F..
..F.. ..L..
```

Names can have actual meanings, literal analysis from Lexicon pieces, spelling variants, nicknames, and related names.

## Generator syntax

- `C`, `V`, `L` - Additional Pattern or Lexicon category variables
- `.n.` - Vocabulary variable
- `..F..` - Names variable
- `/` - alternatives
- `[a/b]` - required choice group
- `(x)` - optional group
- `{n}` or `{min,max}` - repetition
- `<...>` - capture
- `&` or `&1` - backreference
- `!` - exclusion, such as `C!m,n`
- quoted text keeps special characters literal

## Import and export

Morf exports `.morf` files, which are JSON data with a custom extension. Import supports `.morf`, `.json`, pasted JSON, and older Morf-style exports where possible.



### 3.5.1 generator polish

- Generated result buttons are labeled plainly: **Add to Vocabulary**, **Add to Lexicon**, and **Add to Names**.
- Generator results show their produced/detected pieces again, so a word like `unfov` can display as `un-fov` with clickable chunks.
- Pattern-generated unknown chunks are collapsed into one useful piece instead of separate letters.
