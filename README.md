# Morf 2.1.6

Morf is a browser-based language-building toolkit for making words from sounds, morphemes, roots, affixes, meanings, and already-created vocabulary. It started from the same general world as tools like Awkwords-style word generators and derivation tools, but it is built around one bigger idea: the generator, lexicon, vocabulary, translator, and dictionary should all feed into each other instead of living in separate apps.

You can use Morf for constructed languages, but it is not only for full conlangs. It also works well for fantasy and sci-fi naming systems, worldbuilding, place names, people names, magic terminology, ancient-language flavor, game lore, tabletop settings, and any project where you want words to feel connected instead of random.

Morf is a static HTML/CSS/JavaScript app. There is no server required. You can open it directly in a browser, host it on GitHub Pages, or use the standalone HTML version.

---

## What Morf does

Morf combines five related tools into one workspace:

1. **Additional Patterns** define reusable sound or spelling patterns, such as consonants, vowels, clusters, syllables, or custom wildcard groups.
2. **Lexicon** stores morphemes: prefixes, roots, suffixes, stems, particles, endings, and other pieces of words.
3. **Vocabulary** stores whole words, such as nouns, verbs, adjectives, names, places, or any finished word in your language or naming system.
4. **Generator** creates new words from patterns, morphemes, vocabulary entries, captures, rewrites, filters, and meanings.
5. **Translator / Analyzer** breaks input words back into lexicon and vocabulary pieces, shows glosses, and suggests alternative parses.

The Dictionary combines Lexicon and Vocabulary into one searchable view so you can use Morf as both a generator and a language notebook.

---

## Quick start

A tiny setup might look like this:

```txt
Additional Patterns
C = p/t/k/m/n/s/l/r
V = a/e/i/o/u

Lexicon
root KAI = bearer/holder
root KYME = magic/magical
suffix TI = adjective marker

Generator Pattern
[CV]{2}
```

A more morphology-heavy setup might use stored morphemes:

```txt
Lexicon
root kyme = magic
root kai = bearer
suffix ti = adjective marker

Generator Pattern
RRS
```

Or vocabulary variables:

```txt
Vocabulary category: noun
kyme = magic
kai = bearer

Generator Pattern
.n.kai
```

The exact category letters depend on how you define your categories. Morf lets you create your own category names and pattern letters instead of forcing one fixed system.

---

## The three main data types

### Additional Patterns

Additional Patterns are reusable pattern variables. They are usually used for sounds, graphemes, syllables, or spelling structures.

Examples:

```txt
V = a/e/i/o/u
C = p/t/k/s/m/n
N = m/n/ng
K = s[t/n]
B = C, N, L, and K
```

If a pattern references another pattern, Morf resolves it recursively. So if `B` can become `K`, and `K` can become `st` or `sn`, the generator keeps resolving until it reaches an actual output string.

Additional Patterns are good for:

- consonants and vowels
- clusters
- syllable templates
- sound classes
- spelling classes
- custom wildcard groups
- reusable generator building blocks

They usually do not carry meanings by themselves, though you can move entries between sections if you want to reorganize your system.

### Lexicon

The Lexicon stores morphemes: meaningful word parts. These can be prefixes, roots, suffixes, infixes, stems, endings, particles, or any custom category you create.

A Lexicon entry usually has:

- a form, such as `pre`, `flor`, or `less`
- a meaning/gloss, such as `before`, `flower`, or `without`
- a category, such as Prefixes, Roots, Suffixes, Endings, or your own custom category
- a placement rule: start, middle, end, or anywhere
- a letter code used in generator patterns

Examples:

```txt
pre = before       placement: start
flor = flower      placement: start/root/anywhere depending on your setup
less = without     placement: end
```

Lexicon entries are meant for building longer words out of meaningful pieces.

For example:

```txt
anti + dis + establish + ment + arian + ism
```

Morf is designed so words can contain many morphemes, not just one prefix and one suffix.

### Vocabulary

Vocabulary stores whole words. These are complete dictionary words, names, places, or terms.

Examples:

```txt
kyme = magic
kai = bearer
kymeetikai = magic bearer
```

Vocabulary entries can be used directly in generator patterns with dot variables:

```txt
.n.
.place.
.name.
```

If `.n.` is a vocabulary category, Morf can insert one whole word from that category.

Vocabulary is different from Lexicon because Vocabulary entries are treated as complete words, while Lexicon entries are treated as word pieces. However, both can have meanings, categories, variants, synonyms, and homonyms, and both appear in the Dictionary.

---

## Generator syntax

Enter a pattern in the Generator. Morf expands the pattern and concatenates the pieces to produce words.

### Uppercase pattern letters

Uppercase letters refer to Additional Patterns or Lexicon category letters.

```txt
C = p/t/k
V = a/e/i/o/u

Pattern: CV
Possible outputs: pa, ti, ku
```

If an uppercase variable references another uppercase variable, Morf resolves nested patterns until it reaches final text.

```txt
B = C, N, L, and K
K = s[t/n]

Pattern: BV
Possible outputs: pa, ma, la, sta, sna
```

### Literal text

Lowercase text is inserted as written.

```txt
Pattern: kai
Output: kai
```

You can mix literals and variables:

```txt
Pattern: kymeCVC
Possible output: kymetok
```

### Alternatives with `/`

Use `/` to choose one option.

```txt
cat/dog/bird
```

This generates one of the alternatives.

### Required groups with `[ ]`

Square brackets group things that must appear together.

```txt
s[tu/top/kan]
```

Possible outputs:

```txt
stu
stop
skan
```

### Optional groups with `( )`

Parentheses create optional material. The content may appear or disappear.

```txt
s(tu/top/kan)
```

Possible outputs include:

```txt
s
stu
stop
skan
```

Parentheses can also be useful in entries and meanings:

```txt
kyme = magic(al)
```

This means the entry can gloss as both `magic` and `magical`.

### Quotes

Use quotes to treat special characters as literal text.

```txt
"[test]"
```

This outputs `[test]` instead of interpreting the brackets as syntax.

### Weights with `*N`

Weights make one option more likely than another.

```txt
a*5/e/i
```

This makes `a` much more likely than `e` or `i`.

### Repetition with `{n}` and `{min,max}`

Repeat a token, group, or pattern.

```txt
C{3}
[CV]{2}
C{1,3}
```

Examples:

```txt
C{3}      -> tkm
[CV]{2}   -> kato
C{1,3}    -> s, tk, msn
```

### Exclusion with `!`

Exclude specific outputs from an uppercase pattern.

```txt
V!a
V!a,e
C!m,n{2}
```

Examples:

```txt
V!a       -> any vowel except a
V!a,e     -> any vowel except a or e
C!m,n{2}  -> two consonants, neither m nor n
```

Exclusion is for pattern references, not for arbitrary groups.

### Captures and backrefs

Use `<...>` to capture generated material. Use `&`, `&1`, `&2`, etc. to repeat captured material.

```txt
<CV>&
```

Possible outputs:

```txt
mama
koko
tutu
```

Indexed examples:

```txt
<C><V>&1V
<C><V>&2
```

Captures are useful for reduplication, echo vowels, gemination, repeated syllables, and morphophonological patterns.

### Vocabulary variables

Dot-wrapped names insert whole vocabulary words from a category.

```txt
.n.
.verb.
.place.
```

If you have a Vocabulary category called `n`, then `.n.` chooses one word from that category.

This lets you generate words from already-created words, not just from sounds or morphemes.

---

## Advanced generator controls

### Rewrite sequences

Rewrite rules apply after a word is generated.

Morf uses `=` for rewrites:

```txt
ti=chi
nb=mb
ae=ahe
```

Old-style `>` rewrites from older files are converted on import when possible.

Rewrites can use variables and captures:

```txt
<C>=&1&1
Cor=Nor
```

This lets you create sound changes or morphophonological alternations after generation.

Evaluation order:

```txt
generation -> rewrites -> forbidden checks -> positional forcing -> final filters
```

### Forbidden sequences

Forbidden sequences reject generated words that contain certain strings or patterns.

```txt
kk
pp
VVV
<C>&1
```

If a generated word matches a forbidden pattern, Morf discards it and tries again.

### Starts with / Contains / Ends with filters

These are normal output filters. They check the final generated string.

Example:

```txt
Pattern: CVC
Starts with: a
```

If `C` cannot generate `a`, Morf generates zero words. The filter does not magically change the first consonant into `a`.

Filters can also use variables:

```txt
Starts with: V
```

If `V = a/e/i/o/u`, then the final word must start with one of those vowels.

### `$...$` forced starts and endings

If you wrap a Starts with or Ends with value in dollar signs, Morf may adjust the generated word to satisfy that requirement.

```txt
Starts with: $pep$
Ends with: $less$
```

For example:

```txt
Pattern: CVCVC
Starts with: $pep$
```

Morf first tries to fit `pep` into the existing pattern. Since `p` can be `C`, `e` can be `V`, and `p` can be `C`, it can produce words beginning with `pep` while still respecting the pattern.

Dollar forcing applies only to Starts with and Ends with. It does not force Contains, because there is no clear place to insert contained material.

### Meanings Mode

Meanings Mode lets you enter your own meaning list, one meaning per line.

Example:

```txt
Dog
Cat
Rabbit
```

If Meanings Mode is checked, Morf generates one word per line and attaches each meaning:

```txt
mato — Dog
kira — Cat
suni — Rabbit
```

When Meanings Mode is unchecked, Morf ignores the meanings text completely, even if text is still in the box.

### Swadesh-style mode

The Swadesh-style option generates a fixed starter list of basic meanings. This is useful for quickly creating a basic vocabulary set. It is separate from custom Meanings Mode.

---

## Synonyms, homonyms, and variations

Morf supports several ways for forms and meanings to relate to each other.

### Variations

Variations are alternate forms of the same entry. They belong together.

```txt
mor[o/u] = water
```

This can represent:

```txt
moro = water
moru = water
```

The Dictionary shows variation words under the same entry.

Slashes in the word form can also mark variations:

```txt
dar/dra = before
```

If you want these to be one entry with variation forms, use variation syntax. If you want them to become separate synonym entries, use comma syntax.

### Synonyms

Synonyms are separate entries with the exact same meaning.

```txt
dar,dra = before
```

This creates two separate entries:

```txt
dar = before
dra = before
```

They are connected as synonyms because the meaning string matches exactly.

Separate manual entries also become synonyms if their meanings match exactly:

```txt
bri = from
feez = from
```

These are synonyms.

But these are not synonyms:

```txt
bri = from
feez = from the
```

The strings are different, so Morf treats them as different meanings.

### Homonyms and additional meanings

Homonyms are cases where the same form has multiple meanings.

```txt
jar = magic/dust
```

The main translation uses the first meaning by default, and alternatives can show the other meanings.

Parentheses can also create meaning variations:

```txt
kyme = magic(al)
```

This can mean:

```txt
magic
magical
```

The Dictionary shows additional meanings under the entry.

---

## Translator / Analyzer

The Translator breaks input words into possible Lexicon and Vocabulary pieces.

Example:

```txt
kymeetikai
```

Morf may analyze this as:

```txt
kyme - ti - kai
magic - adjective marker - bearer
```

Or, if a full Vocabulary entry exists, it can prefer the whole-word match while still showing mixed alternatives.

### Unknown chunks

Unknown material is grouped into chunks instead of split into single letters.

For example, if `less` is known but `fon` is not:

```txt
fonless
```

Morf treats it like:

```txt
fon - less
? - without
```

not:

```txt
f - o - n - less
```

This makes it easier to add `fon` as a new root, word, or vocabulary item.

### Quoted spans

Use quotes to force literal spans:

```txt
"New York"
```

Quoted text is treated as one literal token.

### Placement rules

Lexicon placement matters during analysis.

Start entries, such as prefixes, should only appear in the start zone. Middle entries should appear inside a word. End entries, such as suffixes, should appear in the end zone.

Example:

```txt
pre = before   placement: start
```

If you analyze:

```txt
apprehensive
```

Morf should not translate `pre` in the middle of the word, because it is not in the start zone.

However, start-zone pieces can stack together when the whole beginning of the word is made of start/root pieces:

```txt
preflor
florpre
```

If both `pre` and `flor` are allowed as start-zone pieces in your setup, Morf can parse them together as an attached start chain.

End-zone pieces can also stack as endings or suffixes when they form the ending of the word.

---

## Dictionary

The Dictionary combines Lexicon and Vocabulary entries into one searchable view.

Dictionary cards show:

- the word or morpheme form
- meaning or meanings
- entry type: Lexicon, Vocabulary, or Additional Pattern
- category
- placement/type information
- variation words
- additional meanings
- synonyms

Clicking a Dictionary entry opens edit mode. You can edit the entry, finish editing, or move it to another section/category.

Generated words and translator segments can be added back into the Lexicon or Vocabulary, which turns generation and analysis into a loop:

```txt
generate -> inspect -> add to lexicon/vocabulary -> generate more -> analyze -> refine
```

---

## Import, export, and autosave

Morf can export settings as `.morf` files. These are JSON-based settings files with a custom extension.

Morf 2.1.6 can import:

- `.morf`
- `.json`
- pasted settings JSON

The file picker accepts broad file types because some browsers, especially on phones, treat unknown extensions such as `.morf` strangely.

If a browser refuses to select a `.morf` file, you can:

1. rename it from `.morf` to `.json`, or
2. open it as text, copy the contents, and paste it into the import box.

Morf also autosaves in the browser. Autosave is local to the browser/device and is not a cloud backup, so exporting `.morf` files is still recommended.

---

## Hosting Morf

Morf is a static app. To host the full project, keep these files together:

```txt
index.html
styles.css
morf-core.js
app.js
README.md
```

Open or host `index.html` from the same folder as the JavaScript and CSS files.

You can also use the standalone HTML version, which bundles everything into one file for easy testing.

Good hosting options for static apps include:

- GitHub Pages
- Netlify
- Cloudflare Pages
- Vercel

---

## Tips for using Morf

Start small. Define a few consonants, vowels, and one or two morpheme categories before building a huge system.

Use Additional Patterns for reusable sound structures:

```txt
C = p/t/k/m/n
V = a/e/i/o/u
S = [CV]{2}
```

Use Lexicon for meaningful pieces:

```txt
kai = bearer
kyme = magic
less = without
```

Use Vocabulary for complete words:

```txt
kymeetikai = magic bearer
```

Use the Analyzer to check whether a word can be segmented the way you intended.

Use Meanings Mode when you want Morf to generate exactly one word for each meaning in a list.

Use export often when building a serious language or naming system.

---

## Version 2.1.6 notes

This version keeps the Morf 2.1.x feature set and focuses on import compatibility:

- `.morf` and `.json` settings import
- paste-import fallback
- file picker loosened for browsers that block unknown extensions
- dictionary editing and move controls from earlier 2.1.x builds
- duplicate/synonym add buttons
- highlighted Pick Random behavior
- custom Meanings Mode behavior
- synonym, homonym, and variation support
- cleaner Dictionary cards
- stricter Translator placement rules

---

## Project idea

Morf exists because word generation, derivation, dictionaries, and analysis are all connected. A language is not just random words, and a naming system is not just a list of pretty syllables. Morf is meant to help you grow words from smaller pieces, reuse what you already made, and keep meanings attached as your world, language, or story expands.
