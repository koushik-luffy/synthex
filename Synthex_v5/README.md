# 🧩 Synthex — Summarize, Learn, Respond

**“Clean summaries instantly. Gain insight fast.”**

Synthex is a Chrome extension designed to simplify your online reading, studying, and email workflow. With AI-powered summarization, flashcard generation, and email assistance, Synthex saves time and helps you focus on what matters.

---

## 🚀 Inspiration

In today's world, we are constantly bombarded with information — long emails, endless web pages, and overflowing study notes. We wanted a tool that could cut through the noise and give time back to users who read and learn online.

Inspired by ChatGPT and Notion AI, we created **Synthex**, a lightweight assistant that lives right inside your browser, streamlining learning, working, and communicating.

---

## 💡 Features

- **📨 Mail Assistant**: Summarize emails, draft professional replies, and suggest subject lines.
- **🌐 Web Summarizer + Chat**: Get concise summaries of long web pages and chat with page context.
- **🧠 Flashcard Generator**: Turn any notes or topics into AI-generated study flashcards.
- **🎯 Focus Mode**: Display motivational quotes and generate affirmations based on browsing habits.

Everything works directly from the extension popup — fast, clean, and distraction-free.

---

## ⚙️ Built With

- **Frontend:** HTML, CSS, JavaScript
- **Chrome Extension APIs:** Manifest v3 (scripting, tabs, storage)
- **AI:** Google Gemini 2.0 Flash API (summarization, rewriting, flashcards)
- **Architecture:** Service Worker for AI communication, Content Scripts for DOM extraction
- **Other Tools:** Custom parser to convert AI responses into structured flashcards

**Message Flow:**  
`Popup.js → chrome.runtime.sendMessage → Service Worker → Gemini API → Popup.js`

---

## 🔬 Challenges We Faced

- **Model Compatibility:** Migrating from Gemini-Pro to Gemini-2.0-Flash introduced API schema changes.  
- **DOM Extraction:** Extracting clean text from Gmail and Outlook required precise selectors and handling dynamic content.  
- **Prompt Reliability:** Iteratively designed prompts to ensure structured JSON flashcards.  
- **UI Constraints:** Creating a minimal, productive popup required balancing design and functionality.

---

## 🧠 What We Learned

- Connecting frontend extensions to AI APIs securely via service workers.
- Advanced prompt engineering for structured outputs (Q&A flashcards).
- UX matters: small touches like "Summarizing..." indicators and dark mode improve engagement.
- Less is more: embedding AI into existing workflows can be more effective than building separate platforms.
- Debugging JSON parsing errors the hard way 😅

---

## 🧮 Demo: Math Support

Synthex can handle technical content including equations. Example: the quadratic formula

\[
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
\]

Generates flashcards like:

- **Term:** What is the quadratic formula?  
- **Definition:**  
\[
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
\]  
Used to solve  
\[
ax^2 + bx + c = 0
\]

---

## 🔮 Roadmap

- Integrate **Gemini 2.0 Pro Vision** for video and PDF summarization
- Add **speech summarization** for podcasts and YouTube lectures
- Sync flashcards and notes across devices using **Firebase**
- Enable **offline AI summarization** with local caching

Our goal: make Synthex the ultimate AI sidekick for anyone who reads, studies, or communicates online.

---

## 📥 Installation

1. Clone this repository:  
```bash
git clone https://github.com/yourusername/synthex.git
