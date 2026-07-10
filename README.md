# Morf Version 3

Morf is a static HTML/CSS/JavaScript language-building workshop for generating words, building derivations, storing a dictionary, analyzing words, and now managing proper names.

It is useful for conlangs, but it is not only for conlangs. You can use it for fantasy and sci-fi naming systems, place names, character names, ancient fairy languages, game lore, tabletop settings, magic terminology, or any worldbuilding project where words and names should feel connected.

## What is new in Version 3?

Version 3 adds a full **Names** system.

Names are separate from Vocabulary because names often need extra worldbuilding information:

- a displayed name, including capitals and spaces
- an actual/worldbuilding meaning
- a literal meaning from roots or morphemes
- notes
- nicknames
- spelling variations
- a category/type such as person, place, title, group, deity, or object

Example:

```text
Morobecc/Morbek = coastal area | water-like | western coastal province
Sila = bird-associated personal name | bird | messenger/skyborn name | Sil
Carol[i/y]n(e) = personal name | free person
```

## The four stores

### Additional Patterns

Additional Patterns are reusable sound or spelling patterns. They are usually things like consonants and vowels.

```text
C = p/t/k/s/m/n/l/r
V = a/e/i/o/u
K = s[t/n]
B = C, N, L, K
```

Uppercase letters in generator patterns can refer to these.

### Lexicon

Lexicon categories hold morphemes: roots, prefixes, suffixes, infixes, stems, particles, endings, and other word pieces.

Each category has:

- a letter/code, like `P`, `R`, or `S`
- a placement rule: start, middle, end, or anywhere
- entries written like `form = gloss`
- Version 3 applicability options: applies to words, applies to names

Example:

```text
pre- = before
flor = flower
-la = feminine name ending
```

A name-only suffix category can be marked as applying to names but not normal words.

### Vocabulary

Vocabulary categories hold whole words. They use dot variables.

```text
.n.  = choose a word from a vocabulary category with variable n
.verb. = choose a word from a vocabulary category named or coded verb
```

Vocabulary entries are normal dictionary words:

```text
moro = water
kyme = magic
kai = bearer
kymeetikai = magic bearer
```

### Names

Names are proper nouns and worldbuilding names. They use double-dot variables.

```text
..F.. = choose a name from a name category with variable F
..place.. = choose a name from a place-name category
..F.. ..L.. = first name + space + last name
```

Names can contain capitals and spaces without capital letters being interpreted as generator variables.

## Generator syntax

```text
CV
[CV]{2}
CVC(S)
<CV>&
.n.
..F..
..F.. ..L..
```

Supported syntax includes:

- uppercase variables: `C`, `V`, `R`, `S`
- vocabulary variables: `.n.`
- name variables: `..F..`
- slash alternatives: `a/e/i`
- required groups: `[CV]`
- optional groups: `(CV)`
- repetition: `C{3}` or `[CV]{2,4}`
- exclusions: `V!a,e`
- captures: `<CV>`
- backrefs: `&`, `&1`, `&2`
- quoted literals: `"New York"`
- nested variables, including comma lists such as `B = C, N, L, and K`

## Rewrites and filters

Rewrites use `=`:

```text
ti=chi
nb=mb
<C>=&1&1
```

Forbidden sequences reject generated words:

```text
kk
VVV
<C>&1
```

Starts with, Contains, and Ends with are final-output filters. They check the entire generated string, not individual morphemes.

`$...$` forcing works only in Starts with and Ends with. It tries to fit a literal into the existing pattern, then prepends/appends if needed.

```text
Pattern: CVCVC
Starts with: $pep$
```

## Meanings Mode

Meanings Mode lets you paste one meaning per line. Morf generates exactly one word per line and pairs each word with that meaning.

```text
Dog
Cat
Rabbit
```

If Meanings Mode is unchecked, the meanings text is ignored.

## Translator / Analyzer

The analyzer segments input into:

- Lexicon morphemes
- Vocabulary words
- Names
- unknown chunks

It respects placement rules. Prefix/start entries do not parse in the middle of unrelated words. Middle entries cannot parse at the beginning or end. End entries only parse in ending zones.

Names can be recognized as full name entries, while their pieces can still be analyzed from Lexicon when appropriate.

## Dictionary

The Dictionary combines Lexicon, Vocabulary, and Names. You can filter by scope or category, search by form or meaning, and click entries to edit them.

Dictionary cards can show:

- variation words
- additional meanings/homonyms
- synonyms
- literal meaning for names
- notes for names
- nicknames for names

## Synonyms, homonyms, and variations

Comma entries create separate synonym entries:

```text
dar,dra = before
```

Slash/bracket/parentheses forms are spelling variations inside one entry:

```text
mor[o/u] = water
Jord[a/y]n = personal name
Carol[i/y]n(e) = personal name
```

Slash or optional meanings create additional meanings:

```text
jar = magic/dust
kyme = magic(al)
```

## Import and export

Morf exports `.morf` files, which are JSON settings files with a custom extension. It imports both `.morf` and `.json`, and also includes a paste-import fallback for browsers that dislike unknown file extensions.

## Hosting

Morf is static. You can host it on GitHub Pages, Netlify, Cloudflare Pages, Vercel, or any static web host.

Open `index.html` for the full project version, or use the standalone HTML file if you want one single file containing the entire app.
