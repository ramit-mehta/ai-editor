// src/components/Agent.js
export async function webSearchAndSummarize(query) {
  try {
    // 1) DuckDuckGo instant answer (no API key required)
    const ddResp = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(
          query
        )}&format=json&no_html=1&skip_disambig=1`
      )}`
    );
    const dd = await ddResp.json();

    const snippets = [];
    if (dd.AbstractText) snippets.push(dd.AbstractText);
    if (Array.isArray(dd.RelatedTopics)) {
      dd.RelatedTopics.slice(0, 6).forEach((rt) => {
        if (rt.Text) snippets.push(rt.Text);
        else if (rt.Topics)
          rt.Topics.slice(0, 3).forEach((t) => t.Text && snippets.push(t.Text));
      });
    }

    const combined =
      snippets.join("\n\n").trim() || `No snippets found for "${query}".`;

    // 2) Ask Groq to summarize
    const system =
      "You are an assistant that summarizes search results into a clear, short paragraph with 3 bullets and a short 2-sentence conclusion. Return only the summary.";
    const user = `Search query: ${query}\n\nSearch snippets:\n${combined}`;

    const resp = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      }
    );

    const data = await resp.json();
    const summary = data?.choices?.[0]?.message?.content || combined;
    return summary;
  } catch (err) {
    console.error("Agent error:", err);
    return "Agent failed: " + err.message;
  }
}
