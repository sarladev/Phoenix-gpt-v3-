function saveApiKey() {
  const key = prompt("Paste your OpenRouter API key:");

  if (!key) return;

  localStorage.setItem("phoenix_v3_api_key", key);
  alert("API key saved in this browser only.");
}

async function streamOpenRouterAPI(chatMessages, onToken) {
  const apiKey = localStorage.getItem("phoenix_v3_api_key");

  if (!apiKey) {
    onToken("Please click 🔑 API Key and paste your OpenRouter API key first.");
    return;
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.href,
      "X-Title": "Phoenix GPT v3"
    },
    body: JSON.stringify({
      model: "openrouter/free",
      stream: true,
      messages: [
        {
          role: "system",
          content: "You are Phoenix GPT v3, a fast, helpful, creative AI assistant. Reply clearly, simply and professionally. Format code properly when needed."
        },
        ...chatMessages
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    onToken("API Error: " + errorText);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;

      const data = line.replace("data:", "").trim();

      if (data === "[DONE]") {
        return fullText;
      }

      try {
        const json = JSON.parse(data);
        const token = json.choices?.[0]?.delta?.content || "";

        if (token) {
          fullText += token;
          onToken(token);
        }
      } catch (error) {}
    }
  }

  return fullText;
      }
