import { API_KEY } from "./secret.js"; // ✅ Now your key is stored separately

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "RUN_AI") {
    runAI(msg.prompt, msg.model)
      .then(output => sendResponse({ output }))
      .catch(err => sendResponse({ error: err.message || String(err) }));
    return true; // Keep message channel open for async response
  }
});

async function runAI(prompt, model = "gemini-2.0-flash") {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  const body = {
    contents: [
      { parts: [{ text: prompt }] }
    ]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text 
            || data?.output_text
            || JSON.stringify(data);

    return txt;
  } catch (e) {
    return `Error: ${e.message || e}`;
  }
}
