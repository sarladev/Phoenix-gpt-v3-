const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const thinking = document.getElementById("thinking");
const fileInput = document.getElementById("fileInput");

if (!activeConversationId || conversations.length === 0) {
  createConversation("Welcome Chat");
}

renderConversationList();
renderChat();

async function sendMessage() {
  let text = userInput.value.trim();

  if (!text) return;

  const fileText = await readUploadedFile();

  if (fileText) {
    text += "\n\nUploaded file content:\n" + fileText;
  }

  lastQuestion = text;
  userInput.value = "";

  const convo = getActiveConversation();

  if (convo.messages.length === 0) {
    convo.title = text.slice(0, 28) + (text.length > 28 ? "..." : "");
  }

  convo.messages.push({
    role: "user",
    content: text
  });

  saveConversations();
  addMessageToUI("user", text);

  thinking.classList.remove("hidden");

  const botUI = createBotStreamingMessage();
  let finalAnswer = "";

  try {
    finalAnswer = await streamOpenRouterAPI(convo.messages, function(token) {
      botUI.textContent += token;
      chatBox.scrollTop = chatBox.scrollHeight;
    });
  } catch (error) {
    finalAnswer = "Error: " + error.message;
    botUI.textContent = finalAnswer;
  }

  thinking.classList.add("hidden");

  if (!finalAnswer) {
    finalAnswer = botUI.textContent;
  }

  lastAnswer = finalAnswer;

  convo.messages.push({
    role: "assistant",
    content: finalAnswer
  });

  saveConversations();

  addCopyButton(botUI.parentElement, finalAnswer);
}

function renderChat() {
  const convo = getActiveConversation();

  chatBox.innerHTML = `
    <div class="message bot">
      <div class="avatar">🤖</div>
      <div class="bubble">
        <b>Phoenix GPT</b>
        <p>Hello Vanshika 👋 I am Phoenix GPT v3. Ask me anything.</p>
      </div>
    </div>
  `;

  convo.messages.forEach(msg => {
    addMessageToUI(msg.role === "user" ? "user" : "bot", msg.content);
  });
}

function addMessageToUI(role, text) {
  const message = document.createElement("div");
  message.className = "message " + role;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "👤" : "🤖";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  bubble.innerHTML = `
    <b>${role === "user" ? "You" : "Phoenix GPT"}</b>
    <div>${formatMarkdown(text)}</div>
  `;

  if (role === "bot") {
    addCopyButton(bubble, text);
  }

  if (role === "user") {
    message.appendChild(bubble);
    message.appendChild(avatar);
  } else {
    message.appendChild(avatar);
    message.appendChild(bubble);
  }

  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function createBotStreamingMessage() {
  const message = document.createElement("div");
  message.className = "message bot";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "🤖";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  bubble.innerHTML = `<b>Phoenix GPT</b><div class="streaming-text"></div>`;

  message.appendChild(avatar);
  message.appendChild(bubble);
  chatBox.appendChild(message);

  return bubble.querySelector(".streaming-text");
}

function addCopyButton(parent, text) {
  const copy = document.createElement("button");
  copy.className = "copy-btn";
  copy.textContent = "Copy";
  copy.onclick = () => navigator.clipboard.writeText(text);
  parent.appendChild(copy);
}

function createNewConversation() {
  createConversation("New Chat");
  renderChat();
  renderConversationList();
  closeSidebarOnMobile();
}

function clearCurrentChat() {
  if (!confirm("Clear current chat?")) return;

  const convo = getActiveConversation();
  convo.messages = [];
  convo.title = "New Chat";

  saveConversations();
  renderChat();
}

async function regenerate() {
  if (!lastQuestion) {
    alert("No previous question found.");
    return;
  }

  userInput.value = lastQuestion;
  await sendMessage();
}

function copyLastAnswer() {
  if (!lastAnswer) {
    alert("No answer to copy.");
    return;
  }

  navigator.clipboard.writeText(lastAnswer);
  alert("Copied.");
}

function downloadChat() {
  const convo = getActiveConversation();

  const text = convo.messages
    .map(m => `${m.role.toUpperCase()}:\n${m.content}`)
    .join("\n\n");

  const blob = new Blob([text], { type: "text/plain" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "phoenix-gpt-v3-chat.txt";
  a.click();
}

function quickPrompt(text) {
  userInput.value = text;
  userInput.focus();
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

function closeSidebarOnMobile() {
  document.getElementById("sidebar").classList.remove("active");
}

function readUploadedFile() {
  return new Promise((resolve) => {
    const file = fileInput.files[0];

    if (!file) {
      resolve("");
      return;
    }

    if (!file.type.includes("text")) {
      resolve("Uploaded file: " + file.name + ". This version reads text files only.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result.slice(0, 9000));
    };

    reader.readAsText(file);
  });
}

function formatMarkdown(text) {
  let safe = escapeHTML(text);

  safe = safe.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
  safe = safe.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  safe = safe.replace(/\n/g, "<br>");

  return safe;
}

function escapeHTML(text) {
  return text.replace(/[&<>"']/g, function(char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
    }
