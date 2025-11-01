// Synthex v5 popup.js - fully functional flashcards + structured outputs
const navBtns = document.querySelectorAll('.nav-btn');
navBtns.forEach(b =>
  b.addEventListener('click', () => {
    navBtns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.tab').forEach(t => {
      t.style.display = t.id === b.dataset.tab ? '' : 'none';
    });
  })
);

// 🌗 Dark mode toggle (simple)
const modeBtn = document.getElementById('modeToggle');
if (modeBtn) modeBtn.addEventListener('click', () => document.body.classList.toggle('dark'));

// --------------------- Helpers ---------------------
function setStatus(msg, timeout = 2000) {
  const s = document.getElementById('status');
  if (!s) return;
  s.textContent = 'Status: ' + msg;
  if (timeout)
    setTimeout(() => {
      if (s.textContent === 'Status: ' + msg) s.textContent = 'Status: ready';
    }, timeout);
}

async function runAI(prompt, model = 'gemini-2.0-flash') {
  const r = await chrome.runtime.sendMessage({ type: 'RUN_AI', prompt, model });
  return r.output || r.error || '';
}

function tryParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

// --------------------- Renderers ---------------------
function renderSummary(el, text) {
  el.innerHTML = '';
  const h = document.createElement('h3');
  h.textContent = '🧾 Summary';
  el.appendChild(h);
  const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const ul = document.createElement('ul');
  if (lines.length === 1) {
    const sents = text.match(/[^\.\!\?]+[\.\!\?]?/g) || [text];
    sents.slice(0, 8).forEach(s => {
      const li = document.createElement('li');
      li.textContent = s.trim();
      ul.appendChild(li);
    });
  } else {
    lines.slice(0, 10).forEach(l => {
      const li = document.createElement('li');
      li.textContent = l;
      ul.appendChild(li);
    });
  }
  el.appendChild(ul);
}

function renderReplies(el, text) {
  el.innerHTML = '';
  const parts = text.split(/\n\s*---\s*\n|\n\s*Variant\s*\d+\s*[:\-]/i).map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) parts.push(text);
  parts.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'panel-glass card';
    const h = document.createElement('h4');
    h.textContent = '💬 Reply ' + (i + 1);
    const pre = document.createElement('pre');
    pre.textContent = p;
    const cbtn = document.createElement('button');
    cbtn.className = 'ghost';
    cbtn.textContent = 'Copy';
    cbtn.addEventListener('click', () => navigator.clipboard.writeText(p));
    card.appendChild(h);
    card.appendChild(pre);
    card.appendChild(cbtn);
    el.appendChild(card);
  });
}

function renderSubjects(el, text) {
  el.innerHTML = '';
  const h = document.createElement('h3');
  h.textContent = '📧 Suggested Subjects';
  el.appendChild(h);
  const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const ol = document.createElement('ol');
  lines.slice(0, 10).forEach(l => {
    const li = document.createElement('li');
    li.textContent = l.replace(/^\d+[\)\.\s]*/, '');
    ol.appendChild(li);
  });
  el.appendChild(ol);
}

// --------------------- Mail Actions ---------------------
const detectBtn = document.getElementById('detectBtn'),
  summarizeBtn = document.getElementById('summarizeBtn'),
  replyBtn = document.getElementById('replyBtn'),
  subjectBtn = document.getElementById('subjectBtn');
const emailText = document.getElementById('emailText'),
  mailResult = document.getElementById('mailResult'),
  copyMail = document.getElementById('copyMail'),
  clearMail = document.getElementById('clearMail');

if (detectBtn)
  detectBtn.addEventListener('click', async () => {
    setStatus('detecting...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      const resp = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const h = window.__synthex_helpers;
          if (h && typeof h.getMailData === 'function') return h.getMailData();
          return window.__synthex_mail || null;
        },
      });
      const payload = resp?.[0]?.result || null;
      if (payload) {
        emailText.value = payload.text || '';
        setStatus('detected');
        return;
      }
    } catch (e) {
      console.error(e);
      setStatus('detect error');
    }
    setStatus('no mail detected');
  });

if (summarizeBtn)
  summarizeBtn.addEventListener('click', async () => {
    const txt = emailText.value.trim();
    if (!txt) return setStatus('no text');
    setStatus('summarizing...');
    const out = await runAI(`Summarize this email into concise bullet points and 3 insights:\n\n${txt}`);
    renderSummary(mailResult, out);
    setStatus('done');
  });

if (replyBtn)
  replyBtn.addEventListener('click', async () => {
    const txt = emailText.value.trim();
    if (!txt) return setStatus('no text');
    setStatus('generating replies...');
    const out = await runAI(`Write 2 professional reply variants separated by '---':\n\n${txt}`);
    renderReplies(mailResult, out);
    setStatus('done');
  });

if (subjectBtn)
  subjectBtn.addEventListener('click', async () => {
    const txt = emailText.value.trim();
    if (!txt) return setStatus('no text');
    setStatus('suggesting subjects...');
    const out = await runAI(`Suggest 6 short subject lines, one per line, for the email below:\n\n${txt}`);
    renderSubjects(mailResult, out);
    setStatus('done');
  });

if (copyMail)
  copyMail.addEventListener('click', async () => {
    const val = mailResult.innerText || emailText.value || '';
    if (!val) return;
    await navigator.clipboard.writeText(val);
    setStatus('copied');
  });

if (clearMail)
  clearMail.addEventListener('click', () => {
    emailText.value = '';
    mailResult.innerHTML = '';
    setStatus('cleared');
  });

// --------------------- Web Actions ---------------------
const summarizePageBtn = document.getElementById('summarizePage'),
  fetchSelectionBtn = document.getElementById('fetchSelection'),
  webResult = document.getElementById('webResult'),
  webInput = document.getElementById('webInput'),
  sendWeb = document.getElementById('sendWeb'),
  webChatBox = document.getElementById('webChatBox');

if (summarizePageBtn)
  summarizePageBtn.addEventListener('click', async () => {
    webResult.innerHTML = '';
    setStatus('summarizing page...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const resp = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_TEXT' });
      const pageText = (resp?.text || '').slice(0, 12000);
      if (!pageText) return (webResult.textContent = 'No readable text found.');
      const out = await runAI(`Summarize this webpage into clear bullet points and 3 concise insights:\n\n${pageText}`);
      renderSummary(webResult, out);
      setStatus('done');
    } catch (e) {
      webResult.textContent = 'Error: ' + e.message;
      setStatus('error');
    }
  });

  if (sendWeb)
  sendWeb.addEventListener('click', async () => {
    const q = webInput.value.trim();
    if (!q) return;

    webInput.value = '';
    const prev = webResult.innerText.trim();
    if (!prev) return setStatus('Summarize page first');

    // Show user question in chat
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.textContent = q;
    webChatBox.appendChild(userMsg);

    setStatus('thinking...');

    const prompt = `Based on the following summary/content, answer the user's question clearly.\n\nContent:\n${prev}\n\nQuestion: ${q}`;
    const out = await runAI(prompt);

    // Show AI reply in chat
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-msg bot';
    botMsg.textContent = out.trim();
    webChatBox.appendChild(botMsg);

    webChatBox.scrollTop = webChatBox.scrollHeight;
    setStatus('done');
  });


// --------------------- Focus / Flashcards ---------------------
const quoteEl = document.getElementById('quote'),
  affEl = document.getElementById('affirmation'),
  newQuote = document.getElementById('newQuote'),
  regenAff = document.getElementById('regenAff');

const quotes = [
  'Discipline is choosing between what you want now and what you want most.',
  'The way to get started is to quit talking and begin doing.',
  'Your focus determines your reality.',
  'Small progress each day adds up to big results.',
  'Success is the sum of small efforts, repeated day in and day out.',
  'Do something today that your future self will thank you for.',
  'Dream big. Start small. Act now.',
  'Don’t watch the clock; do what it does. Keep going.',
  'Focus on being productive instead of busy.',
  'Push yourself, because no one else is going to do it for you.',
];
if (quoteEl) quoteEl.innerText = quotes[Math.floor(Math.random() * quotes.length)];
if (newQuote)
  newQuote.addEventListener('click', () => (quoteEl.innerText = quotes[Math.floor(Math.random() * quotes.length)]));

if (regenAff)
  regenAff.addEventListener('click', async () => {
    setStatus('generating affirmation...');
    try {
      const historyItems = await chrome.history.search({ text: '', maxResults: 6, startTime: Date.now() - 86400000 });
      const sites = historyItems.map(i => {
        try {
          return new URL(i.url).hostname;
        } catch (e) {
          return '';
        }
      });
      const prompt = `Based on browsing summary: ${sites.join(
        ', '
      )}\nGenerate a 1-sentence motivational affirmation.`;
      const out = await runAI(prompt);
      affEl.innerText = out;
      setStatus('');
    } catch (e) {
      affEl.innerText = 'Stay strong and keep moving forward.';
      setStatus('');
    }
  });

// --------------------- Flashcards ---------------------
async function loadFlashcards() {
  const d = await chrome.storage.local.get(['synthex_flashcards']);
  return d.synthex_flashcards || [];
}
async function saveFlashcards(arr) {
  await chrome.storage.local.set({ synthex_flashcards: arr });
}

let currentCards = [],
  currentIndex = 0,
  flipped = false;

function updateProgress() {
  const p = document.getElementById('progress');
  if (p) p.textContent = currentCards.length ? `${currentIndex + 1} / ${currentCards.length}` : '0 / 0';
}

function showCardAt(index, flip) {
  const wrapper = document.getElementById('cardWrapper');
  if (!wrapper) return;
  wrapper.innerHTML = '';
  if (!currentCards.length) {
    wrapper.innerHTML = '<div class="meta">No flashcards yet.</div>';
    updateProgress();
    return;
  }
  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'card-wrapper';
  const front = document.createElement('div');
  front.className = 'card front panel-glass';
  front.innerHTML = `<div class="card-term">${currentCards[index].term}</div>`;
  const back = document.createElement('div');
  back.className = 'card back panel-glass';
  back.innerHTML = `<div class="card-def">${currentCards[index].definition}</div>`;
  cardWrapper.appendChild(front);
  cardWrapper.appendChild(back);
  if (flip) cardWrapper.classList.add('flipped');
  wrapper.appendChild(cardWrapper);
  updateProgress();
}

// Navigation and actions
document.getElementById('prevCard')?.addEventListener('click', () => {
  if (!currentCards.length) return;
  currentIndex = (currentIndex - 1 + currentCards.length) % currentCards.length;
  flipped = false;
  showCardAt(currentIndex, flipped);
});
document.getElementById('nextCard')?.addEventListener('click', () => {
  if (!currentCards.length) return;
  currentIndex = (currentIndex + 1) % currentCards.length;
  flipped = false;
  showCardAt(currentIndex, flipped);
});
document.getElementById('flipCard')?.addEventListener('click', () => {
  flipped = !flipped;
  const cw = document.querySelector('.card-wrapper');
  if (cw) cw.classList.toggle('flipped');
});
document.getElementById('shuffleCards')?.addEventListener('click', () => {
  if (!currentCards.length) return;
  for (let i = currentCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [currentCards[i], currentCards[j]] = [currentCards[j], currentCards[i]];
  }
  currentIndex = 0;
  flipped = false;
  showCardAt(currentIndex, flipped);
});

document.getElementById('exportCards')?.addEventListener('click', async () => {
  const cards = await loadFlashcards();
  const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'synthex_flashcards.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importCards')?.addEventListener('click', () =>
  document.getElementById('importFile').click()
);

document.getElementById('importFile')?.addEventListener('change', async ev => {
  const f = ev.target.files[0];
  if (!f) return;
  const text = await f.text();
  try {
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) throw new Error('Invalid');
    await saveFlashcards(arr);
    currentCards = arr;
    currentIndex = 0;
    flipped = false;
    showCardAt(currentIndex, flipped);
    setStatus('Imported');
  } catch (e) {
    setStatus('Import failed');
  }
});

document.getElementById('clearAll')?.addEventListener('click', async () => {
  if (!confirm('Clear ALL flashcards?')) return;
  await saveFlashcards([]);
  currentCards = [];
  currentIndex = 0;
  document.getElementById('cardWrapper').innerHTML = '';
  updateProgress();
  setStatus('Cleared all flashcards');
});

async function generateFlashcards(topic) {
  setStatus('Generating flashcards...');
  const primaryPrompt = `OUTPUT MUST BE valid JSON array ONLY. Create 10 concise study flashcards about this topic. Each item must be an object with keys "term" and "definition". Example: [{"term":"X","definition":"..."}]. Topic: ${topic}`;
  let out = await runAI(primaryPrompt);
  let cards = tryParseJSON(out);
  if (!cards) {
    const m = out.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (m) cards = tryParseJSON(m[0]);
  }
  if (!cards) {
    const retryPrompt = `PLEASE RETURN ONLY a valid JSON array. No extra text. Create 10 flashcards for: ${topic}. Keys: 'term' and 'definition'.`;
    out = await runAI(retryPrompt);
    cards = tryParseJSON(out);
    if (!cards) {
      const m2 = out.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (m2) cards = tryParseJSON(m2[0]);
    }
  }
  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    const fallback = out
      .split(/\n\n+/)
      .map(g => g.trim())
      .filter(Boolean)
      .slice(0, 10)
      .map(g => {
        const lines = g.split(/\n/).map(l => l.trim()).filter(Boolean);
        return {
          term: lines[0].replace(/^\d+[\)\.\s]*/, ''),
          definition: lines.slice(1).join(' ') || '',
        };
      });
    cards = fallback;
  }
  cards = (cards || []).slice(0, 10).map(c => ({
    term: c.term || c.Term || c.title || '',
    definition: c.definition || c.def || c.meaning || c.desc || c.definition_text || '',
  }));
  if (cards.length === 0) {
    setStatus('No cards produced');
    return [];
  }
  const existing = await loadFlashcards();
  const merged = cards.concat(existing);
  await saveFlashcards(merged);
  return merged;
}

// Manual generation
document.getElementById('genCards')?.addEventListener('click', async () => {
  const topic = document.getElementById('fcTopic').value.trim();
  if (!topic) return setStatus('Enter a topic or notes');
  const merged = await generateFlashcards(topic);
  if (merged && merged.length) {
    currentCards = merged;
    currentIndex = 0;
    flipped = false;
    showCardAt(currentIndex, false);
    updateProgress();
    setStatus('✨ Generated 10 flashcards', 3000);
  }
});

// 🌐 NEW: Auto-detect and generate flashcards from current webpage
document.getElementById('genFromPage')?.addEventListener('click', async () => {
  setStatus('Extracting text from page...');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const resp = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_TEXT' });
    const pageText = (resp?.text || '').slice(0, 12000);
    if (!pageText) return setStatus('No readable text found');
    const merged = await generateFlashcards(pageText);
    if (merged && merged.length) {
      currentCards = merged;
      currentIndex = 0;
      flipped = false;
      showCardAt(currentIndex, false);
      updateProgress();
      setStatus('🧠 Flashcards generated from page', 3000);
    }
  } catch (e) {
    console.error(e);
    setStatus('Extraction failed');
  }
});

// Init
window.addEventListener('load', async () => {
  try {
    const d = await loadFlashcards();
    currentCards = d || [];
    if (currentCards.length) showCardAt(0, false);
    updateProgress();
  } catch (e) {}
});
