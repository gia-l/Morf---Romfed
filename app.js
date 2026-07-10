(function(){
  'use strict';

  const M = window.MorfCore;
  const STORE_KEY = 'morf-2-settings-v9-polish';
  let state = M.normalizeState(M.DEFAULT_STATE);
  let lastResults = [];
  let lastStats = {};
  let lastElapsed = 0;
  let selectedSegment = null;
  let editingEntry = null;
  let saveTimer = null;

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function setStatus(message, kind='info'){
    const el = $('#status');
    if(!el) return;
    el.textContent = message;
    el.dataset.kind = kind;
  }

  function debounceSave(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveLocal, 250);
  }

  function saveLocal(){
    try {
      if(!window.localStorage) return;
      localStorage.setItem(STORE_KEY, M.exportState(state));
    } catch(err){
      // Some website previewers and mobile file viewers block localStorage.
      // The app should still work; only autosave is skipped.
      setStatus('Autosave unavailable here; export still works.', 'info');
    }
  }

  function loadLocal(){
    try {
      if(!window.localStorage) return M.normalizeState(M.DEFAULT_STATE);
      const raw = localStorage.getItem(STORE_KEY);
      if(!raw) return M.normalizeState(M.DEFAULT_STATE);
      return M.importState(raw);
    } catch(err){
      return M.normalizeState(M.DEFAULT_STATE);
    }
  }

  function download(filename, text, type='application/json'){
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function applyOutputFont(){
    const familyMap = {
      system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      arial: 'Arial, Helvetica, sans-serif',
      verdana: 'Verdana, Geneva, sans-serif',
      tahoma: 'Tahoma, Geneva, sans-serif',
      trebuchet: '"Trebuchet MS", sans-serif',
      georgia: 'Georgia, serif',
      garamond: 'Garamond, Baskerville, serif',
      palatino: 'Palatino, "Palatino Linotype", serif',
      courier: '"Courier New", Courier, monospace',
      lucida: '"Lucida Console", Monaco, monospace',
      impact: 'Impact, Haettenschweiler, sans-serif',
      comic: '"Comic Sans MS", "Comic Sans", cursive',
      papyrus: 'Papyrus, fantasy',
      times: '"Times New Roman", Times, serif',
      century: '"Century Gothic", CenturyGothic, sans-serif',
      bookman: '"Bookman Old Style", Bookman, serif',
      candara: 'Candara, Calibri, sans-serif',
      optima: 'Optima, Candara, sans-serif',
      didot: 'Didot, Bodoni 72, serif',
      futura: 'Futura, Trebuchet MS, sans-serif'
    };
    const targets = [$('#results'), $('#outputText'), $('#dictionaryList'), $('#analysisOutput')].filter(Boolean);
    for(const target of targets){
      target.style.fontFamily = familyMap[state.font.family] || familyMap.system;
      target.style.fontSize = `${state.font.size || 20}px`;
      target.style.fontWeight = state.font.bold ? '800' : '400';
      target.style.fontStyle = state.font.italic ? 'italic' : 'normal';
    }
  }

  function syncControls(){
    $('#pattern').value = state.generator.pattern || '';
    $('#genCount').value = state.generator.count || 100;
    $('#avoidDuplicates').checked = !!state.generator.avoidDuplicates;
    $('#capitalize').checked = !!state.generator.capitalize;
    $('#newlineEach').checked = !!state.generator.newlineEach;
    $('#detectLexicon').checked = !!state.generator.detectLexicon;
    $('#meaningsMode').checked = !!state.generator.meaningsMode;
    $('#meaningsText').value = state.generator.meaningsText || '';
    $('#assignCoreMeanings').checked = !!state.generator.assignCoreMeanings;
    $('#swadeshMode').checked = !!state.generator.swadeshMode;
    $('#rewrites').value = state.advanced.rewrites || '';
    $('#forbidden').value = state.advanced.forbidden || '';
    $('#starts').value = state.advanced.starts || '';
    $('#contains').value = state.advanced.contains || '';
    $('#ends').value = state.advanced.ends || '';
    $('#fontFamily').value = state.font.family || 'system';
    $('#fontSize').value = state.font.size || 20;
    $('#fontBold').checked = !!state.font.bold;
    $('#fontItalic').checked = !!state.font.italic;
    updateMeaningModeUI();
    renderEditors();
    renderDictionary();
    applyOutputFont();
  }

  function customMeaningLines(){
    return (state.generator.meaningsText || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }

  function syncMeaningCountDisplay(){
    const countBox = $('#genCount');
    if(!countBox) return;
    if($('#meaningsMode') && $('#meaningsMode').checked){
      const n = customMeaningLines().length;
      countBox.value = n || '';
      countBox.title = n ? `Meanings Mode will generate ${n} word${n === 1 ? '' : 's'}.` : 'Add one meaning per line to set the generated amount.';
    }
  }

  function updateMeaningModeUI(){
    const countBox = $('#genCount');
    const meaningsOn = $('#meaningsMode').checked;
    const swadeshOn = $('#swadeshMode').checked;
    $('#meaningsTextWrap').hidden = !meaningsOn;
    if(countBox) countBox.disabled = meaningsOn || swadeshOn;
    if(meaningsOn){
      syncMeaningCountDisplay();
      $('#assignCoreMeanings').checked = false;
      $('#swadeshMode').checked = false;
      state.generator.assignCoreMeanings = false;
      state.generator.swadeshMode = false;
    } else if(countBox && !swadeshOn){
      const savedCount = Math.max(1, Math.min(9999, Number(state.generator.count || 100)));
      countBox.value = savedCount;
      countBox.title = '';
    }
    if(swadeshOn){
      $('#assignCoreMeanings').checked = false;
      $('#meaningsMode').checked = false;
      state.generator.assignCoreMeanings = false;
      state.generator.meaningsMode = false;
      $('#meaningsTextWrap').hidden = true;
      if(countBox){
        countBox.disabled = true;
        countBox.value = 256;
        countBox.title = 'Swadesh-style mode always generates 256 words.';
      }
    }
  }


  function readGeneratorControlsFromDOM(){
    const el = id => $('#' + id);
    const meaningsOn = !!(el('meaningsMode') && el('meaningsMode').checked);
    const swadeshOn = !!(el('swadeshMode') && el('swadeshMode').checked);
    if(el('pattern')) state.generator.pattern = el('pattern').value;
    if(el('genCount') && !meaningsOn && !swadeshOn) state.generator.count = Math.max(1, Math.min(9999, Number(el('genCount').value || 100)));
    if(el('avoidDuplicates')) state.generator.avoidDuplicates = el('avoidDuplicates').checked;
    if(el('capitalize')) state.generator.capitalize = el('capitalize').checked;
    if(el('newlineEach')) state.generator.newlineEach = el('newlineEach').checked;
    if(el('detectLexicon')) state.generator.detectLexicon = el('detectLexicon').checked;
    if(el('meaningsMode')) state.generator.meaningsMode = meaningsOn;
    if(el('assignCoreMeanings')) state.generator.assignCoreMeanings = el('assignCoreMeanings').checked;
    if(el('swadeshMode')) state.generator.swadeshMode = swadeshOn;
    if(el('meaningsText')) state.generator.meaningsText = el('meaningsText').value;
    if(el('rewrites')) state.advanced.rewrites = el('rewrites').value;
    if(el('forbidden')) state.advanced.forbidden = el('forbidden').value;
    if(el('starts')) state.advanced.starts = el('starts').value;
    if(el('contains')) state.advanced.contains = el('contains').value;
    if(el('ends')) state.advanced.ends = el('ends').value;
    if(state.generator.meaningsMode){
      state.generator.assignCoreMeanings = false;
      state.generator.swadeshMode = false;
    } else if(state.generator.swadeshMode){
      state.generator.assignCoreMeanings = false;
    }
  }

  function bindTabs(){
    $$('.tab').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        if(window.MorfSwitchTab){
          window.MorfSwitchTab(btn.dataset.tab);
          return;
        }
        $$('.tab').forEach(b => b.classList.remove('active'));
        $$('.panel').forEach(p => { p.classList.remove('active'); p.hidden = true; });
        btn.classList.add('active');
        const panel = $('#' + btn.dataset.tab) || $('#tab-' + btn.dataset.tab);
        if(panel){ panel.classList.add('active'); panel.hidden = false; }
        if(btn.dataset.tab === 'dictionary') renderDictionary();
        try { history.replaceState(null, '', '#' + btn.dataset.tab); } catch(err) {}
      });
    });
  }

  function bindGeneratorControls(){
    const on = (sel, type, fn) => { const el = $(sel); if(el) el.addEventListener(type, fn); };
    const bind = (sel, fn) => {
      const el = $(sel);
      if(el) el.addEventListener('input', () => { fn(el); debounceSave(); });
      if(el) el.addEventListener('change', () => { fn(el); debounceSave(); });
    };
    bind('#pattern', el => state.generator.pattern = el.value);
    bind('#genCount', el => state.generator.count = Math.max(1, Math.min(9999, Number(el.value || 1))));
    bind('#avoidDuplicates', el => state.generator.avoidDuplicates = el.checked);
    bind('#capitalize', el => state.generator.capitalize = el.checked);
    bind('#newlineEach', el => state.generator.newlineEach = el.checked);
    bind('#detectLexicon', el => state.generator.detectLexicon = el.checked);
    bind('#meaningsText', el => { state.generator.meaningsText = el.value; syncMeaningCountDisplay(); });
    bind('#rewrites', el => state.advanced.rewrites = el.value);
    bind('#forbidden', el => state.advanced.forbidden = el.value);
    bind('#starts', el => state.advanced.starts = el.value);
    bind('#contains', el => state.advanced.contains = el.value);
    bind('#ends', el => state.advanced.ends = el.value);

    on('#meaningsMode', 'change', e => {
      state.generator.meaningsMode = e.target.checked;
      updateMeaningModeUI();
      debounceSave();
    });
    on('#assignCoreMeanings', 'change', e => {
      state.generator.assignCoreMeanings = e.target.checked;
      if(e.target.checked){
        state.generator.meaningsMode = false;
        state.generator.swadeshMode = false;
        $('#meaningsMode').checked = false;
        $('#swadeshMode').checked = false;
      }
      updateMeaningModeUI();
      debounceSave();
    });
    on('#swadeshMode', 'change', e => {
      state.generator.swadeshMode = e.target.checked;
      if(e.target.checked){
        state.generator.meaningsMode = false;
        state.generator.assignCoreMeanings = false;
        $('#meaningsMode').checked = false;
        $('#assignCoreMeanings').checked = false;
      }
      updateMeaningModeUI();
      debounceSave();
    });

    on('#generateBtn', 'click', generate);
    on('#sampleBtn', 'click', loadSample);
    on('#alphabetizeBtn', 'click', alphabetizeResults);
    on('#pickRandomBtn', 'click', pickRandomResult);
    on('#selectAllBtn', 'click', selectCopyOutput);
  }

  function alphabetizeResults(){
    if(!lastResults.length){ setStatus('Generate words first, then alphabetize.', 'error'); return; }
    lastResults.sort((a,b) => a.word.localeCompare(b.word));
    renderResults(lastResults, lastStats, lastElapsed);
  }

  function pickRandomResult(){
    if(!lastResults.length){ setStatus('Generate words first, then pick random.', 'error'); return; }
    const pickIndex = Math.floor(Math.random() * lastResults.length);
    const picked = Object.assign({}, lastResults[pickIndex], { picked: true });
    const rest = lastResults
      .filter((_, idx) => idx !== pickIndex)
      .map(item => Object.assign({}, item, { picked: false }));
    lastResults = [picked].concat(rest);
    renderResults(lastResults, lastStats, lastElapsed);
    setStatus(`Random pick moved to top: ${picked.word}${picked.gloss ? ' — ' + picked.gloss : ''}`, 'success');
    const top = $('#results .resultItem.picked');
    if(top && top.scrollIntoView) top.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function selectCopyOutput(){
    const out = $('#outputText');
    if(!out){ setStatus('No output box found.', 'error'); return; }
    out.focus();
    out.select();
    try { navigator.clipboard.writeText(out.value); setStatus('Output selected and copied.', 'success'); }
    catch(err){ setStatus('Output selected.', 'info'); }
  }

  function getMeaningsForGeneration(){
    if(state.generator.swadeshMode) return M.DEFAULT_CORE_MEANINGS.slice(0, 256);
    if(state.generator.meaningsMode){
      return customMeaningLines();
    }
    if(state.generator.assignCoreMeanings){
      const pool = M.DEFAULT_CORE_MEANINGS.slice();
      for(let i=pool.length-1;i>0;i--){
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, state.generator.count || 100);
    }
    return [];
  }

  function zeroGenerationMessage(stats){
    const parts = [];
    if(stats.ruleErrors && stats.ruleErrors.length) parts.push('one advanced rule has an issue: ' + stats.ruleErrors[0]);
    if(stats.filters) parts.push('Starts / Contains / Ends filters rejected the generated words');
    if(stats.forbidden) parts.push('Forbidden sequences rejected the generated words');
    if(stats.duplicates) parts.push('Filter duplicates may have exhausted the small word pool');
    if(stats.failed) parts.push('the pattern could not expand with the current imported categories/patterns');
    if(stats.errors && stats.errors.length) parts.push(stats.errors[0]);
    if(!parts.length) parts.push('the current pattern/settings did not produce usable words');
    return 'Generated 0 words: ' + parts.join('; ') + '.';
  }

  function generate(){
    try {
      readGeneratorControlsFromDOM();
      const pattern = (state.generator.pattern || '').trim();
      if(!pattern){
        lastResults = [];
        lastStats = {};
        lastElapsed = 0;
        $('#results').innerHTML = '<div class="notice error">Enter a generator pattern first, like <code>CV</code> or <code>[CV]{2}</code>.</div>';
        $('#outputText').value = '';
        $('#resultStats').textContent = 'No pattern entered';
        setStatus('Enter a generator pattern first.', 'error');
        return;
      }
      const meanings = getMeaningsForGeneration();
      const count = meanings.length || state.generator.count || 100;
      const start = (window.performance && performance.now) ? performance.now() : Date.now();
      const run = M.generateWords(state, { count, meanings });
      const elapsed = Math.round(((window.performance && performance.now) ? performance.now() : Date.now()) - start);
      lastResults = run.results.map(item => Object.assign({}, item, { picked: false }));
      lastStats = run.stats || {};
      lastElapsed = elapsed;
      renderResults(lastResults, lastStats, lastElapsed);
      const status = run.stats.generated
        ? `Generated ${run.stats.generated}/${run.stats.requested} in ${elapsed} ms. Attempts: ${run.stats.attempts}.`
        : zeroGenerationMessage(run.stats);
      setStatus(status, run.stats.generated ? 'success' : 'error');
      debounceSave();
    } catch(err){
      setStatus(err.message, 'error');
      $('#results').innerHTML = `<div class="notice error">${escapeHtml(err.message)}</div>`;
    }
  }

  function isDictionarySegment(seg){
    return seg && (seg.source === 'lexicon' || seg.source === 'vocabulary');
  }

  function displaySegmentsForResult(item){
    const word = String((item && item.word) || '');
    const rawSegs = Array.isArray(item && item.segs) ? item.segs : [];
    if(!word || !rawSegs.length) return rawSegs;

    const aligned = [];
    let pos = 0;
    for(const seg of rawSegs){
      const form = String((seg && seg.form) || '');
      if(!form) continue;
      const idx = word.indexOf(form, pos);
      if(idx < 0) continue;
      if(idx > pos){
        aligned.push({ form: word.slice(pos, idx), cat: 'generated', source: 'generated', gloss: '?' });
      }
      aligned.push(Object.assign({}, seg, { form: word.slice(idx, idx + form.length) }));
      pos = idx + form.length;
      if(pos >= word.length) break;
    }
    if(pos < word.length){
      aligned.push({ form: word.slice(pos), cat: 'generated', source: 'generated', gloss: '?' });
    }

    const collapsed = [];
    let unknown = '';
    const flushUnknown = () => {
      if(unknown){
        collapsed.push({ form: unknown, cat: 'generated', source: 'generated', gloss: '?' });
        unknown = '';
      }
    };
    for(const seg of aligned){
      if(isDictionarySegment(seg)){
        flushUnknown();
        collapsed.push(seg);
      } else {
        unknown += String(seg.form || '');
      }
    }
    flushUnknown();
    return collapsed;
  }

  function renderResults(results, stats={}, elapsed=0){
    const wrap = $('#results');
    if(!results.length){
      const requested = stats && stats.requested;
      const msg = requested ? zeroGenerationMessage(stats) : 'No words yet.';
      wrap.innerHTML = `<div class="notice ${requested ? 'error' : ''}">${escapeHtml(msg)}</div>`;
      $('#outputText').value = '';
      let statText = requested ? `Printed 0 of ${stats.requested}` : 'No words';
      if(stats && stats.duplicates) statText += ` · duplicates skipped ${stats.duplicates}`;
      if(stats && stats.forbidden) statText += ` · forbidden skipped ${stats.forbidden}`;
      if(stats && stats.filters) statText += ` · filter skipped ${stats.filters}`;
      if(stats && stats.failed) statText += ` · failed attempts ${stats.failed}`;
      if(stats && stats.ruleErrors && stats.ruleErrors.length) statText += ` · rule issues: ${stats.ruleErrors.slice(0, 3).join('; ')}`;
      $('#resultStats').textContent = statText;
      return;
    }
    wrap.innerHTML = results.map((item, idx) => {
      const analysis = item.analysis && item.analysis.primary ? item.analysis.primary : [];
      const segs = analysis.length ? analysis : displaySegmentsForResult(item);
      const segmentsHtml = segs.map(seg => segmentHtml(seg)).join('');
      const gloss = item.gloss || (analysis.length ? M.glossForSegments(analysis) : '');
      const quickGloss = escapeHtml(item.gloss || gloss || '');
      return `<article class="resultItem${item.picked ? ' picked' : ''}" data-word="${escapeHtml(item.word)}">
        <div class="resultTop">
          <span class="num">${idx + 1}</span>
          <strong class="word">${escapeHtml(item.word)}</strong>
          ${item.picked ? '<span class="tag pickedTag">random pick</span>' : ''}
          ${item.gloss ? `<span class="gloss">${escapeHtml(item.gloss)}</span>` : ''}
          <span class="resultAddButtons">
            <button class="small quickAddWord" type="button" data-prefer="vocab" data-form="${escapeHtml(item.word)}" data-gloss="${quickGloss}">Add as duplicate/synonym to Vocabulary</button>
            <button class="small quickAddWord" type="button" data-prefer="lex" data-form="${escapeHtml(item.word)}" data-gloss="${quickGloss}">Add as duplicate/synonym to Lexicon</button>
          </span>
        </div>
        <div class="segments" aria-label="Segments for ${escapeHtml(item.word)}">${segmentsHtml || '<span class="muted">No segmentation</span>'}</div>
        ${gloss && !item.gloss ? `<div class="miniGloss">${escapeHtml(gloss)}</div>` : ''}
      </article>`;
    }).join('');

    const outputLines = results.map(item => item.gloss ? `${item.word} — ${item.gloss}` : item.word);
    $('#outputText').value = state.generator.newlineEach ? outputLines.join('\n') : outputLines.join(' ');
    let statText = `Printed ${stats.generated ?? results.length}`;
    if(stats.requested) statText += ` of ${stats.requested}`;
    if(stats.duplicates) statText += ` · duplicates skipped ${stats.duplicates}`;
    if(stats.forbidden) statText += ` · forbidden skipped ${stats.forbidden}`;
    if(stats.filters) statText += ` · filter skipped ${stats.filters}`;
    if(stats.rewrites) statText += ` · rewrites fired ${stats.rewrites}`;
    if(stats.adjusted) statText += ` · positional fixes ${stats.adjusted}`;
    if(elapsed) statText += ` · ${elapsed} ms`;
    if(stats.ruleErrors && stats.ruleErrors.length) statText += ` · rule issues: ${stats.ruleErrors.slice(0, 3).join('; ')}`;
    $('#resultStats').textContent = statText;
    applyOutputFont();
  }

  function segmentHtml(seg){
    if(!seg || !seg.form) return '';
    const source = seg.source || seg.cat || 'segment';
    const label = `${seg.cat || source}${seg.gloss ? ': ' + seg.gloss : ''}`;
    const shownCat = source === 'generated' ? '?' : (seg.cat || source);
    return `<button class="segment" type="button" data-form="${escapeHtml(seg.form)}" data-gloss="${escapeHtml(seg.gloss === '?' ? '' : (seg.gloss || ''))}" title="${escapeHtml(label)}">
      <span class="segForm">${escapeHtml(seg.form)}</span><span class="segCat">${escapeHtml(shownCat)}</span>
    </button>`;
  }

  function bindSegmentClicks(){
    document.body.addEventListener('click', e => {
      const editBtn = e.target.closest('.dictEdit');
      if(editBtn){
        e.preventDefault();
        openEntryEditDialog(editBtn.dataset.scope, editBtn.dataset.catid, editBtn.dataset.entryid);
        return;
      }
      const quickWord = e.target.closest('.quickAddWord');
      if(quickWord){
        selectedSegment = { form: quickWord.dataset.form || '', gloss: quickWord.dataset.gloss || '', prefer: quickWord.dataset.prefer || '' };
        openSegmentDialog(selectedSegment, selectedSegment.prefer);
        return;
      }
      const seg = e.target.closest('.segment');
      if(seg){
        selectedSegment = { form: seg.dataset.form || seg.textContent.trim(), gloss: seg.dataset.gloss || '' };
        openSegmentDialog(selectedSegment);
      }
    });
  }

  function renderEditors(){
    renderAdditionalPatterns();
    renderLexicon();
    renderVocabulary();
    populateCategorySelects();
  }

  function cardHeader(title, subtitle, delClass){
    return `<div class="cardHead"><div><strong>${escapeHtml(title)}</strong>${subtitle ? `<span>${escapeHtml(subtitle)}</span>` : ''}</div><button class="small danger ${delClass}" type="button">Delete</button></div>`;
  }

  function renderAdditionalPatterns(){
    const wrap = $('#additionalList');
    wrap.innerHTML = (state.additionalPatterns || []).map(p => `<section class="card" data-id="${escapeHtml(p.id)}">
      ${cardHeader(p.name || p.letter || 'Pattern', `Variable ${p.letter || '?'}`, 'deleteAdd')}
      <div class="grid two">
        <label>Letter / code<input class="addLetter" maxlength="8" value="${escapeHtml(p.letter || '')}"></label>
        <label>Name<input class="addName" value="${escapeHtml(p.name || '')}"></label>
      </div>
      <label>Pattern<textarea class="addPattern" spellcheck="false">${escapeHtml(p.pattern || '')}</textarea></label>
    </section>`).join('') || '<div class="notice">No additional patterns yet.</div>';
  }

  function renderLexicon(){
    const wrap = $('#lexiconList');
    wrap.innerHTML = (state.lexiconCategories || []).map(c => `<section class="card" data-id="${escapeHtml(c.id)}">
      ${cardHeader(c.name || c.letter || 'Lexicon', `Letter ${c.letter || '?'} · ${c.placement || 'anywhere'}`, 'deleteLex')}
      <div class="grid three">
        <label>Letter<input class="lexLetter" maxlength="8" value="${escapeHtml(c.letter || '')}"></label>
        <label>Name<input class="lexName" value="${escapeHtml(c.name || '')}"></label>
        <label>Placement<select class="lexPlacement">
          ${['start','middle','end','anywhere'].map(v => `<option value="${v}" ${v === (c.placement || 'anywhere') ? 'selected' : ''}>${v}</option>`).join('')}
        </select></label>
      </div>
      <label>Entries <span class="hint">one per line: form = gloss; hyphens are okay, like ma- or -i</span><textarea class="lexEntries" spellcheck="false">${escapeHtml(M.entriesToText(c.entries || [], 'lex'))}</textarea></label>
    </section>`).join('') || '<div class="notice">No lexicon categories yet.</div>';
  }

  function renderVocabulary(){
    const wrap = $('#vocabularyList');
    wrap.innerHTML = (state.vocabularyCategories || []).map(c => `<section class="card" data-id="${escapeHtml(c.id)}">
      ${cardHeader(c.name || c.variable || 'Vocabulary', `Variable .${c.variable || '?'}.`, 'deleteVoc')}
      <div class="grid two">
        <label>Dot variable<input class="vocVariable" value="${escapeHtml(c.variable || '')}"></label>
        <label>Name<input class="vocName" value="${escapeHtml(c.name || '')}"></label>
      </div>
      <label>Whole-word entries <span class="hint">one per line: word = gloss</span><textarea class="vocEntries" spellcheck="false">${escapeHtml(M.entriesToText(c.entries || [], 'vocab'))}</textarea></label>
    </section>`).join('') || '<div class="notice">No vocabulary categories yet.</div>';
  }

  function bindEditors(){
    $('#addAdditionalBtn').addEventListener('click', () => {
      state.additionalPatterns.push({ id: M.uid('add'), letter: 'X', name: 'New pattern', pattern: 'a/e/i' });
      renderAdditionalPatterns(); debounceSave();
    });
    $('#addLexiconBtn').addEventListener('click', () => {
      state.lexiconCategories.push({ id: M.uid('lex'), letter: 'X', name: 'New category', placement: 'anywhere', entries: [] });
      renderLexicon(); populateCategorySelects(); debounceSave();
    });
    $('#addVocabularyBtn').addEventListener('click', () => {
      state.vocabularyCategories.push({ id: M.uid('voc'), variable: 'x', name: 'New vocabulary', entries: [] });
      renderVocabulary(); populateCategorySelects(); debounceSave();
    });
    $('#resetDefaultsBtn').addEventListener('click', () => {
      if(confirm('Restore the starter Morf 2.0 settings? This replaces the current local settings.')){
        state = M.normalizeState(M.DEFAULT_STATE);
        lastResults = [];
        syncControls();
        saveLocal();
        setStatus('Starter settings restored.', 'success');
      }
    });

    $('#additionalList').addEventListener('input', e => updateAdditionalFromEvent(e));
    $('#additionalList').addEventListener('click', e => {
      if(e.target.classList.contains('deleteAdd')){
        const id = e.target.closest('.card').dataset.id;
        state.additionalPatterns = state.additionalPatterns.filter(p => p.id !== id);
        renderAdditionalPatterns(); debounceSave();
      }
    });
    $('#lexiconList').addEventListener('input', e => updateLexFromEvent(e));
    $('#lexiconList').addEventListener('change', e => updateLexFromEvent(e));
    $('#lexiconList').addEventListener('click', e => {
      if(e.target.classList.contains('deleteLex')){
        const id = e.target.closest('.card').dataset.id;
        state.lexiconCategories = state.lexiconCategories.filter(c => c.id !== id);
        renderLexicon(); populateCategorySelects(); debounceSave();
      }
    });
    $('#vocabularyList').addEventListener('input', e => updateVocFromEvent(e));
    $('#vocabularyList').addEventListener('click', e => {
      if(e.target.classList.contains('deleteVoc')){
        const id = e.target.closest('.card').dataset.id;
        state.vocabularyCategories = state.vocabularyCategories.filter(c => c.id !== id);
        renderVocabulary(); populateCategorySelects(); debounceSave();
      }
    });
  }

  function updateAdditionalFromEvent(e){
    const card = e.target.closest('.card');
    if(!card) return;
    const p = state.additionalPatterns.find(x => x.id === card.dataset.id);
    if(!p) return;
    if(e.target.classList.contains('addLetter')) p.letter = e.target.value.trim();
    if(e.target.classList.contains('addName')) p.name = e.target.value;
    if(e.target.classList.contains('addPattern')) p.pattern = e.target.value;
    debounceSave();
  }

  function updateLexFromEvent(e){
    const card = e.target.closest('.card');
    if(!card) return;
    const c = state.lexiconCategories.find(x => x.id === card.dataset.id);
    if(!c) return;
    if(e.target.classList.contains('lexLetter')) c.letter = e.target.value.trim();
    if(e.target.classList.contains('lexName')) c.name = e.target.value;
    if(e.target.classList.contains('lexPlacement')) c.placement = e.target.value;
    if(e.target.classList.contains('lexEntries')) c.entries = M.textToEntries(e.target.value, 'lex');
    populateCategorySelects();
    debounceSave();
  }

  function updateVocFromEvent(e){
    const card = e.target.closest('.card');
    if(!card) return;
    const c = state.vocabularyCategories.find(x => x.id === card.dataset.id);
    if(!c) return;
    if(e.target.classList.contains('vocVariable')) c.variable = e.target.value.replace(/^\.+|\.+$/g, '').trim().toLowerCase();
    if(e.target.classList.contains('vocName')) c.name = e.target.value;
    if(e.target.classList.contains('vocEntries')) c.entries = M.textToEntries(e.target.value, 'vocab');
    populateCategorySelects();
    debounceSave();
  }

  function populateCategorySelects(){
    const lexOptions = (state.lexiconCategories || []).map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name || c.letter)}</option>`).join('');
    const vocOptions = (state.vocabularyCategories || []).map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name || c.variable)}</option>`).join('');
    const patOptions = (state.additionalPatterns || []).map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml((p.letter || '?') + ' · ' + (p.name || 'Pattern'))}</option>`).join('');
    const lexSel = $('#segmentLexCat');
    const vocSel = $('#segmentVocCat');
    if(lexSel) lexSel.innerHTML = lexOptions;
    if(vocSel) vocSel.innerHTML = vocOptions;
    const moveLex = $('#moveLexCat');
    const moveVoc = $('#moveVocCat');
    const movePat = $('#movePatternCat');
    if(moveLex) moveLex.innerHTML = lexOptions;
    if(moveVoc) moveVoc.innerHTML = vocOptions;
    if(movePat) movePat.innerHTML = patOptions;
    const filter = $('#dictCategoryFilter');
    if(filter){
      const current = filter.value || 'all';
      const opts = ['<option value="all">All categories</option>']
        .concat((state.lexiconCategories || []).map(c => `<option value="lex:${escapeHtml(c.id)}">Lexicon: ${escapeHtml(c.name || c.letter)}</option>`))
        .concat((state.vocabularyCategories || []).map(c => `<option value="voc:${escapeHtml(c.id)}">Vocabulary: ${escapeHtml(c.name || c.variable)}</option>`));
      filter.innerHTML = opts.join('');
      filter.value = opts.some(o => o.includes(`value="${current}"`)) ? current : 'all';
    }
  }

  function bindTranslator(){
    const analyzeBtn = $('#analyzeBtn');
    if(analyzeBtn) analyzeBtn.addEventListener('click', analyzeInput);
    const analysisInput = $('#analysisInput');
    if(analysisInput) analysisInput.addEventListener('keydown', e => {
      if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)) analyzeInput();
    });
    const addRawLexBtn = $('#addRawLexBtn');
    if(addRawLexBtn) addRawLexBtn.addEventListener('click', () => {
      const word = (($('#analysisInput') && $('#analysisInput').value) || '').trim().split(/\s+/)[0];
      if(!word){ setStatus('Type a word first.', 'error'); return; }
      selectedSegment = { form: word, gloss: '' };
      openSegmentDialog(selectedSegment);
    });
  }

  function analyzeInput(){
    const text = $('#analysisInput').value.trim();
    if(!text){ setStatus('Type something to analyze.', 'error'); return; }
    try {
      const analyses = M.analyzeText(text, state);
      renderAnalysis(analyses);
      setStatus(`Analyzed ${analyses.length} token${analyses.length === 1 ? '' : 's'}.`, 'success');
    } catch(err){
      $('#analysisOutput').innerHTML = `<div class="notice error">${escapeHtml(err.message)}</div>`;
      setStatus(err.message, 'error');
    }
  }

  function glossForMeaningChoice(segs){
    return (segs || []).map(s => s.gloss || (s.source === 'unknown' ? '?' : s.form)).filter(Boolean).join('-');
  }

  function meaningChoiceAlternatives(primary, existingAlts){
    const out = [];
    const seen = new Set();
    const add = (segs) => {
      const key = (segs || []).map(s => `${s.source}:${s.cat}:${s.form}:${s.gloss}`).join('|');
      if(!key || seen.has(key)) return;
      seen.add(key);
      out.push(segs);
    };
    for(const alt of existingAlts || []) add(alt);
    const base = primary || [];
    for(let i=0; i<base.length && out.length < 16; i++){
      const meanings = Array.isArray(base[i].meanings) ? base[i].meanings.filter(Boolean) : [];
      for(const meaning of meanings.slice(1)){
        const clone = base.map(seg => Object.assign({}, seg));
        clone[i].gloss = meaning;
        add(clone);
        if(out.length >= 16) break;
      }
    }
    return out;
  }

  function renderAnalysis(analyses){
    $('#analysisOutput').innerHTML = analyses.map(item => {
      const primaryGloss = M.glossForSegments(item.primary);
      const alts = meaningChoiceAlternatives(item.primary || [], item.alternatives || []);
      const altHtml = alts.slice(0, 10).map((alt, i) => `<details><summary>Alternative ${i + 1}: ${escapeHtml(glossForMeaningChoice(alt) || '(no gloss)')}</summary><div class="segments">${alt.map(segmentHtml).join('')}</div></details>`).join('');
      return `<article class="analysisCard">
        <h3>${escapeHtml(item.word)} ${item.literal ? '<span class="tag">quoted literal</span>' : ''}</h3>
        <div class="segments">${(item.primary || []).map(segmentHtml).join('')}</div>
        <div class="miniGloss"><strong>Gloss:</strong> ${escapeHtml(primaryGloss || '(none)')}</div>
        ${altHtml ? `<div class="alternatives">${altHtml}</div>` : ''}
      </article>`;
    }).join('');
    applyOutputFont();
  }

  function setSegmentDialogMode(mode){
    const isEdit = mode === 'edit';
    const addControls = $('#addCategoryControls');
    const addActions = $('#addSegmentActions');
    const editControls = $('#editEntryControls');
    if(addControls) addControls.hidden = isEdit;
    if(addActions) addActions.hidden = isEdit;
    if(editControls) editControls.hidden = !isEdit;
  }

  function openSegmentDialog(seg, prefer=''){
    editingEntry = null;
    const dialog = $('#segmentDialog');
    $('#segmentForm').value = seg.form || '';
    $('#segmentGloss').value = seg.gloss || '';
    populateCategorySelects();
    setSegmentDialogMode('add');
    $('#segmentDialogTitle').textContent = prefer === 'lex' ? 'Add to Lexicon' : (prefer === 'vocab' ? 'Add to Vocabulary' : 'Add segment');
    $('#addSegmentLex').classList.toggle('primary', prefer !== 'vocab');
    $('#addSegmentVoc').classList.toggle('primary', prefer === 'vocab');
    dialog.showModal();
  }

  function findEntryRef(scope, catId, entryId){
    if(scope === 'lex'){
      const cat = (state.lexiconCategories || []).find(c => c.id === catId);
      const entry = cat && (cat.entries || []).find(e => String(e.id || e.form) === String(entryId));
      return cat && entry ? { scope, cat, entry } : null;
    }
    if(scope === 'vocab'){
      const cat = (state.vocabularyCategories || []).find(c => c.id === catId);
      const entry = cat && (cat.entries || []).find(e => String(e.id || e.word) === String(entryId));
      return cat && entry ? { scope, cat, entry } : null;
    }
    return null;
  }

  function openEntryEditDialog(scope, catId, entryId){
    const ref = findEntryRef(scope, catId, entryId);
    if(!ref){ setStatus('Could not find that dictionary entry to edit.', 'error'); return; }
    editingEntry = { scope, catId, entryId };
    populateCategorySelects();
    $('#segmentDialogTitle').textContent = 'Edit dictionary entry';
    $('#segmentForm').value = scope === 'lex' ? (ref.entry.form || '') : (ref.entry.word || '');
    $('#segmentGloss').value = ref.entry.gloss || ref.entry.meaning || '';
    setSegmentDialogMode('edit');
    const moveKind = $('#moveEntryKind');
    if(moveKind){
      moveKind.value = scope === 'lex' ? 'lex' : 'vocab';
      if(scope === 'lex' && $('#moveLexCat')) $('#moveLexCat').value = catId;
      if(scope === 'vocab' && $('#moveVocCat')) $('#moveVocCat').value = catId;
      updateMoveKindUI();
    }
    $('#segmentDialog').showModal();
  }

  function updateMoveKindUI(){
    const kind = $('#moveEntryKind') ? $('#moveEntryKind').value : 'lex';
    if($('#moveLexWrap')) $('#moveLexWrap').hidden = kind !== 'lex';
    if($('#moveVocWrap')) $('#moveVocWrap').hidden = kind !== 'vocab';
    if($('#movePatternWrap')) $('#movePatternWrap').hidden = kind !== 'pattern';
  }

  function saveCurrentEntryEdit(){
    if(!editingEntry){ setStatus('No dictionary entry is open for editing.', 'error'); return; }
    const ref = findEntryRef(editingEntry.scope, editingEntry.catId, editingEntry.entryId);
    if(!ref){ setStatus('That entry no longer exists.', 'error'); return; }
    const form = $('#segmentForm').value.trim();
    const gloss = $('#segmentGloss').value.trim();
    if(!form){ setStatus('Form is blank.', 'error'); return; }
    if(editingEntry.scope === 'lex') ref.entry.form = form;
    else ref.entry.word = form;
    ref.entry.gloss = gloss;
    renderEditors(); renderDictionary(); debounceSave();
    $('#segmentDialog').close();
    setStatus(`Finished editing ${form}.`, 'success');
  }

  function removeEditingEntry(ref){
    if(ref.scope === 'lex') ref.cat.entries = (ref.cat.entries || []).filter(e => e !== ref.entry);
    if(ref.scope === 'vocab') ref.cat.entries = (ref.cat.entries || []).filter(e => e !== ref.entry);
  }

  function moveCurrentEntry(){
    if(!editingEntry){ setStatus('No dictionary entry is open for moving.', 'error'); return; }
    const ref = findEntryRef(editingEntry.scope, editingEntry.catId, editingEntry.entryId);
    if(!ref){ setStatus('That entry no longer exists.', 'error'); return; }
    const form = $('#segmentForm').value.trim();
    const gloss = $('#segmentGloss').value.trim();
    if(!form){ setStatus('Form is blank.', 'error'); return; }
    const kind = $('#moveEntryKind') ? $('#moveEntryKind').value : 'lex';
    if(kind === 'lex'){
      let cat = (state.lexiconCategories || []).find(c => c.id === ($('#moveLexCat') && $('#moveLexCat').value));
      if(!cat){ setStatus('Choose a lexicon category first.', 'error'); return; }
      removeEditingEntry(ref);
      cat.entries.push({ id: M.uid('le'), form, gloss });
      setStatus(`Moved ${form} to Lexicon category: ${cat.name || cat.letter}.`, 'success');
    } else if(kind === 'vocab'){
      let cat = (state.vocabularyCategories || []).find(c => c.id === ($('#moveVocCat') && $('#moveVocCat').value));
      if(!cat){ setStatus('Choose a vocabulary category first.', 'error'); return; }
      removeEditingEntry(ref);
      cat.entries.push({ id: M.uid('ve'), word: form, gloss });
      setStatus(`Moved ${form} to Vocabulary category: ${cat.name || cat.variable}.`, 'success');
    } else {
      let pat = (state.additionalPatterns || []).find(p => p.id === ($('#movePatternCat') && $('#movePatternCat').value));
      if(!pat){ setStatus('Choose an additional pattern first.', 'error'); return; }
      const current = String(pat.pattern || '').trim();
      pat.pattern = current ? `${current}/${form}` : form;
      removeEditingEntry(ref);
      setStatus(`Moved ${form} into Additional pattern ${pat.letter || pat.name}.`, 'success');
    }
    editingEntry = null;
    renderEditors(); populateCategorySelects(); renderDictionary(); debounceSave();
    $('#segmentDialog').close();
  }

  function bindSegmentDialog(){
    $('#closeSegmentDialog').addEventListener('click', () => $('#segmentDialog').close());
    if($('#moveEntryKind')) $('#moveEntryKind').addEventListener('change', updateMoveKindUI);
    if($('#finishEntryEdit')) $('#finishEntryEdit').addEventListener('click', saveCurrentEntryEdit);
    if($('#moveEntryBtn')) $('#moveEntryBtn').addEventListener('click', moveCurrentEntry);
    $('#addSegmentLex').addEventListener('click', () => {
      const form = $('#segmentForm').value.trim();
      if(!form){ setStatus('Segment form is blank.', 'error'); return; }
      let cat = state.lexiconCategories.find(c => c.id === $('#segmentLexCat').value);
      if(!cat){
        cat = { id: M.uid('lex'), letter: 'X', name: 'Quick Lexicon', placement: 'anywhere', entries: [] };
        state.lexiconCategories.push(cat);
      }
      cat.entries.push({ id: M.uid('le'), form, gloss: $('#segmentGloss').value.trim() });
      renderLexicon(); populateCategorySelects(); renderDictionary(); debounceSave();
      $('#segmentDialog').close();
      setStatus(`Added duplicate/synonym ${form} to ${cat.name || cat.letter}.`, 'success');
    });
    $('#addSegmentVoc').addEventListener('click', () => {
      const word = $('#segmentForm').value.trim();
      if(!word){ setStatus('Word is blank.', 'error'); return; }
      let cat = state.vocabularyCategories.find(c => c.id === $('#segmentVocCat').value);
      if(!cat){
        cat = { id: M.uid('voc'), variable: 'x', name: 'Quick Vocabulary', entries: [] };
        state.vocabularyCategories.push(cat);
      }
      cat.entries.push({ id: M.uid('ve'), word, gloss: $('#segmentGloss').value.trim() });
      renderVocabulary(); populateCategorySelects(); renderDictionary(); debounceSave();
      $('#segmentDialog').close();
      setStatus(`Added duplicate/synonym ${word} to ${cat.name || cat.variable}.`, 'success');
    });
  }

  function uniq(arr){
    const out = [];
    const seen = new Set();
    for(const item of arr || []){
      const key = String(item ?? '').trim();
      if(!key || seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
    return out;
  }

  function placementLabel(place){
    if(place === 'start') return 'prefix / start';
    if(place === 'middle') return 'middle / infix';
    if(place === 'end') return 'suffix / ending';
    return 'root / anywhere';
  }

  function entryVariants(raw, engine){
    try {
      const vals = engine.expandStoredForm(raw, { includeLex: false, includeVocab: false, includeAdditional: true });
      return uniq(vals.map(v => M.stripAffixMarks(v))).filter(Boolean);
    } catch(err){
      const stripped = M.stripAffixMarks(raw || '');
      return stripped ? [stripped] : [];
    }
  }

  function collectDictionaryRows(){
    const engine = new M.PatternEngine(state);
    const rows = [];
    for(const cat of state.lexiconCategories || []){
      for(const en of cat.entries || []){
        const variants = entryVariants(en.form || '', engine);
        const meanings = M.entryMeanings ? M.entryMeanings(en) : (en.gloss ? [en.gloss] : []);
        const entryId = en.id || en.form;
        rows.push({
          id: `lex:${cat.id}:${entryId}`,
          type: 'Lexicon',
          scope: 'lex',
          catId: cat.id,
          entryId,
          form: variants[0] || M.stripAffixMarks(en.form || ''),
          displayForm: (variants.length > 1 && en.form) ? en.form : (variants[0] || M.stripAffixMarks(en.form || '')),
          rawForm: en.form || '',
          variants,
          meanings,
          gloss: meanings.join(' / ') || en.gloss || '',
          cat: cat.name || cat.letter || 'Lexicon',
          code: cat.letter || '',
          place: cat.placement || 'anywhere',
          detail: placementLabel(cat.placement || 'anywhere'),
          categoryId: `lex:${cat.id}`
        });
      }
    }
    for(const cat of state.vocabularyCategories || []){
      for(const en of cat.entries || []){
        const variants = entryVariants(en.word || '', engine);
        const meanings = M.entryMeanings ? M.entryMeanings(en) : (en.gloss ? [en.gloss] : []);
        const entryId = en.id || en.word;
        rows.push({
          id: `voc:${cat.id}:${entryId}`,
          type: 'Word',
          scope: 'vocab',
          catId: cat.id,
          entryId,
          form: variants[0] || M.stripAffixMarks(en.word || ''),
          displayForm: (variants.length > 1 && en.word) ? en.word : (variants[0] || M.stripAffixMarks(en.word || '')),
          rawForm: en.word || '',
          variants,
          meanings,
          gloss: meanings.join(' / ') || en.gloss || '',
          cat: cat.name || cat.variable || 'Vocabulary',
          code: cat.variable ? `.${cat.variable}.` : '',
          place: 'whole word',
          detail: 'whole vocabulary word',
          categoryId: `voc:${cat.id}`
        });
      }
    }

    const byMeaning = new Map();
    const byForm = new Map();
    for(const row of rows){
      for(const meaning of row.meanings || []){
        const key = meaning.trim().toLocaleLowerCase();
        if(!key) continue;
        if(!byMeaning.has(key)) byMeaning.set(key, []);
        byMeaning.get(key).push(row);
      }
      for(const form of row.variants && row.variants.length ? row.variants : [row.form]){
        const key = String(form || '').trim();
        if(!key) continue;
        if(!byForm.has(key)) byForm.set(key, []);
        byForm.get(key).push(row);
      }
    }

    for(const row of rows){
      const synonymMap = new Map();
      for(const meaning of row.meanings || []){
        const group = byMeaning.get(meaning.trim().toLocaleLowerCase()) || [];
        for(const other of group){
          if(other.id === row.id) continue;
          synonymMap.set(other.id, other);
        }
      }
      row.synonyms = Array.from(synonymMap.values()).filter(other => {
        return (row.meanings || []).some(m => (other.meanings || []).some(om => om.trim().toLocaleLowerCase() === m.trim().toLocaleLowerCase()));
      });

      const meaningSet = new Map();
      const primary = (row.meanings || [])[0] || '';
      for(const meaning of (row.meanings || []).slice(1)) meaningSet.set(meaning.toLocaleLowerCase(), meaning);
      for(const form of row.variants && row.variants.length ? row.variants : [row.form]){
        const group = byForm.get(String(form || '').trim()) || [];
        for(const other of group){
          for(const meaning of other.meanings || []){
            if(primary && meaning.trim().toLocaleLowerCase() === primary.trim().toLocaleLowerCase()) continue;
            meaningSet.set(meaning.trim().toLocaleLowerCase(), meaning);
          }
        }
      }
      row.additionalMeanings = Array.from(meaningSet.values());
    }
    return rows;
  }

  function dictChip(text, cls=''){
    return `<span class="dictChip ${cls}">${escapeHtml(text)}</span>`;
  }

  function editAttrs(row){
    return `data-scope="${escapeHtml(row.scope)}" data-catid="${escapeHtml(row.catId)}" data-entryid="${escapeHtml(row.entryId)}"`;
  }

  function renderDictionary(){
    const q = ($('#dictionarySearch')?.value || '').trim().toLowerCase();
    const scope = $('#dictionaryScope')?.value || 'all';
    const catFilter = $('#dictCategoryFilter')?.value || 'all';
    let rows = collectDictionaryRows();
    rows = rows.filter(row => {
      if(scope !== 'all' && row.scope !== scope) return false;
      if(catFilter !== 'all' && row.categoryId !== catFilter) return false;
      const hay = [
        row.form, row.displayForm, row.rawForm, row.gloss, row.cat, row.code, row.type, row.detail,
        ...(row.variants || []), ...(row.meanings || []),
        ...(row.synonyms || []).map(s => `${s.form} ${s.gloss} ${s.cat}`),
        ...(row.additionalMeanings || [])
      ].join(' ').toLowerCase();
      return !q || hay.includes(q);
    });

    rows.sort((a,b) => a.form.localeCompare(b.form) || a.type.localeCompare(b.type));

    $('#dictionaryList').innerHTML = rows.length ? rows.map(row => {
      const variants = row.variants || [];
      const meaningHtml = (row.meanings && row.meanings.length)
        ? row.meanings.map(m => dictChip(m, 'meaning')).join('')
        : '<span class="muted">No meaning yet</span>';
      const variationsHtml = variants.length > 1 ? `<details class="dictDetails"><summary>Show variation words (${variants.length})</summary><div class="dictChips">${variants.map(v => `<button type="button" class="dictVariantWord dictEdit" ${editAttrs(row)}>${escapeHtml(v)}</button>`).join('')}</div></details>` : '';
      const addMeanings = row.additionalMeanings || [];
      const meaningsDetails = addMeanings.length ? `<details class="dictDetails"><summary>Show additional meanings (${addMeanings.length})</summary><div class="dictChips">${addMeanings.map(m => dictChip(m, 'extraMeaning')).join('')}</div></details>` : '';
      const synonyms = row.synonyms || [];
      const synonymsHtml = synonyms.length ? `<details class="dictDetails"><summary>See synonyms (${synonyms.length})</summary><div class="synonymList">${synonyms.map(s => `<button type="button" class="synonymItem dictEdit" ${editAttrs(s)}><strong>${escapeHtml(s.displayForm || s.form)}</strong><span>${escapeHtml(s.gloss || '(no meaning)')}</span><em>${escapeHtml(s.type)} · ${escapeHtml(s.cat)}</em></button>`).join('')}</div></details>` : '';
      return `<article class="dictCard">
        <div class="dictMain">
          <button type="button" class="dictWord dictEdit" ${editAttrs(row)} title="Edit this dictionary entry">${escapeHtml(row.displayForm || row.form || '(blank)')}</button>
          <div class="dictMeanings">${meaningHtml}</div>
        </div>
        <div class="dictMeta">
          ${dictChip(row.type, row.scope === 'lex' ? 'lexTag' : 'wordTag')}
          ${dictChip(row.cat)}
          ${row.code ? dictChip(row.code) : ''}
          ${dictChip(row.detail)}
        </div>
        ${variationsHtml}${meaningsDetails}${synonymsHtml}
      </article>`;
    }).join('') : '<div class="notice">No matching dictionary entries.</div>';
    $('#dictCount').textContent = `${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}`;
    applyOutputFont();
  }

  window.renderMorfDictionary = renderDictionary;

  function bindDictionary(){
    ['#dictionarySearch', '#dictionaryScope', '#dictCategoryFilter'].forEach(sel => {
      const el = $(sel);
      if(el) el.addEventListener('input', renderDictionary);
      if(el) el.addEventListener('change', renderDictionary);
    });
  }

  function bindSettings(){
    $('#exportBtn').addEventListener('click', () => {
      const json = M.exportState(state);
      download('morf-2-settings.morf', json, 'application/json');
      setStatus('Exported settings file.', 'success');
    });
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const backup = M.normalizeState(state);
        try {
          try { readGeneratorControlsFromDOM(); } catch(_) {}
          const preserve = M.normalizeState(state);
          const next = M.importState(reader.result, { preserveFrom: preserve });
          state = M.normalizeState(next);
          if(next.meta && Array.isArray(next.meta.importWarnings) && state.meta){
            state.meta.importWarnings = next.meta.importWarnings.slice();
          }
          lastResults = [];
          syncControls();
          saveLocal();
          const warnings = state.meta && Array.isArray(state.meta.importWarnings) ? state.meta.importWarnings : [];
          let msg = warnings.length ? 'Imported settings. Note: ' + warnings[0] : 'Imported settings.';
          setStatus(msg, warnings.length ? 'info' : 'success');
        } catch(err){
          state = backup;
          try { syncControls(); } catch(_) {}
          setStatus('Import failed safely: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
    $('#copySettingsBtn').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(M.exportState(state)); setStatus('Settings JSON copied.', 'success'); }
      catch(err){ download('morf-2-settings.morf', M.exportState(state), 'application/json'); }
    });
    $('#clearLocalBtn').addEventListener('click', () => {
      if(confirm('Clear the browser autosave for Morf 2.0?')){
        try { localStorage.removeItem(STORE_KEY); setStatus('Autosave cleared.', 'success'); }
        catch(err){ setStatus('Autosave was already unavailable here.', 'info'); }
      }
    });
    $('#fontFamily').addEventListener('change', e => { state.font.family = e.target.value; applyOutputFont(); debounceSave(); });
    $('#fontSize').addEventListener('input', e => { state.font.size = Number(e.target.value || 20); applyOutputFont(); debounceSave(); });
    $('#fontBold').addEventListener('change', e => { state.font.bold = e.target.checked; applyOutputFont(); debounceSave(); });
    $('#fontItalic').addEventListener('change', e => { state.font.italic = e.target.checked; applyOutputFont(); debounceSave(); });
  }

  function loadSample(){
    state.generator.pattern = 'P R S / [CV]{2}(C) / <CV>&(CV) / .n.';
    state.advanced.rewrites = 'ti=chi\ntu=tsu\n<C>=&1&1';
    state.advanced.forbidden = 'kkk\nppp\nVVV';
    state.advanced.starts = '';
    state.advanced.contains = '';
    state.advanced.ends = '';
    syncControls();
    debounceSave();
    setStatus('Loaded a mixed phonology + morpheme sample pattern.', 'success');
  }

  window.MorfGenerateClick = function(evt){
    if(evt){ evt.preventDefault(); if(evt.stopImmediatePropagation) evt.stopImmediatePropagation(); }
    generate();
    return false;
  };
  window.MorfAnalyzeClick = function(evt){
    if(evt){ evt.preventDefault(); if(evt.stopImmediatePropagation) evt.stopImmediatePropagation(); }
    analyzeInput();
    return false;
  };
  window.MorfPickRandomClick = function(evt){
    if(evt){ evt.preventDefault(); if(evt.stopImmediatePropagation) evt.stopImmediatePropagation(); }
    pickRandomResult();
    return false;
  };
  window.MorfAlphabetizeClick = function(evt){
    if(evt){ evt.preventDefault(); if(evt.stopImmediatePropagation) evt.stopImmediatePropagation(); }
    alphabetizeResults();
    return false;
  };
  window.MorfSelectAllClick = function(evt){
    if(evt){ evt.preventDefault(); if(evt.stopImmediatePropagation) evt.stopImmediatePropagation(); }
    selectCopyOutput();
    return false;
  };
  window.MorfApp = {
    generate,
    analyze: analyzeInput,
    renderDictionary,
    getState: () => state
  };

  function init(){
    const steps = [
      ['load settings', () => { state = loadLocal(); }],
      ['tabs', bindTabs],
      ['generator', bindGeneratorControls],
      ['editors', bindEditors],
      ['translator', bindTranslator],
      ['segment clicks', bindSegmentClicks],
      ['segment dialog', bindSegmentDialog],
      ['dictionary', bindDictionary],
      ['settings', bindSettings],
      ['sync controls', syncControls],
      ['initial hash', () => {
        if(window.MorfTabs && location.hash && document.getElementById(location.hash.slice(1))){
          window.MorfTabs.show(location.hash.slice(1));
        }
      }],
      ['initial output', () => renderResults([])]
    ];
    const failed = [];
    for(const [name, fn] of steps){
      try { fn(); }
      catch(err){ failed.push(`${name}: ${err.message}`); }
    }
    setStatus(failed.length ? 'Loaded with one issue: ' + failed[0] : 'Ready.', failed.length ? 'error' : 'info');
    if(failed.length) console.warn('Morf init issues:', failed);
  }

  window.addEventListener('error', function(e){
    try { setStatus('Script issue: ' + (e.message || 'unknown error'), 'error'); } catch(_) {}
  });

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
