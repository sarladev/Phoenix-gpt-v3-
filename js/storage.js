let conversations = JSON.parse(localStorage.getItem("phoenix_v3_conversations")) || [];
let activeConversationId = localStorage.getItem("phoenix_v3_active_id") || null;

let lastQuestion = "";
let lastAnswer = "";

function createConversation(title = "New Chat") {
  const id = Date.now().toString();

  const conversation = {
    id,
    title,
    messages: []
  };

  conversations.unshift(conversation);
  activeConversationId = id;

  saveConversations();

  return conversation;
}

function getActiveConversation() {
  let conversation = conversations.find(c => c.id === activeConversationId);

  if (!conversation) {
    conversation = createConversation();
  }

  return conversation;
}

function saveConversations() {
  localStorage.setItem("phoenix_v3_conversations", JSON.stringify(conversations));
  localStorage.setItem("phoenix_v3_active_id", activeConversationId);
  renderConversationList();
}

function renderConversationList() {
  const list = document.getElementById("conversationList");
  if (!list) return;

  list.innerHTML = "";

  conversations.forEach(convo => {
    const item = document.createElement("div");
    item.className = "conversation-item";

    if (convo.id === activeConversationId) {
      item.classList.add("active");
    }

    item.textContent = convo.title;

    item.onclick = () => {
      activeConversationId = convo.id;
      localStorage.setItem("phoenix_v3_active_id", activeConversationId);
      renderChat();
      renderConversationList();
      closeSidebarOnMobile();
    };

    list.appendChild(item);
  });
}
