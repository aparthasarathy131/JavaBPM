(function () {
  'use strict';

  var STORAGE_KEY = 'chat-history.v1';

  var state = {
    conversations: [],
    activeId: null
  };

  var els = {
    history: document.getElementById('history'),
    messages: document.getElementById('messages'),
    title: document.getElementById('conversation-title'),
    input: document.getElementById('input'),
    composer: document.getElementById('composer'),
    newChat: document.getElementById('new-chat')
  };

  // ---- persistence -------------------------------------------------------

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && Array.isArray(saved.conversations)) {
        state.conversations = saved.conversations;
        state.activeId = saved.activeId || null;
      }
    } catch (e) {
      state.conversations = [];
      state.activeId = null;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage unavailable: keep working in memory */
    }
  }

  // ---- helpers -----------------------------------------------------------

  function activeConversation() {
    for (var i = 0; i < state.conversations.length; i++) {
      if (state.conversations[i].id === state.activeId) return state.conversations[i];
    }
    return null;
  }

  function titleFrom(text) {
    var clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return 'Untitled';
    if (clean.length <= 42) return clean;
    var cut = clean.slice(0, 42);
    var lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > 20) cut = cut.slice(0, lastSpace);
    return cut + '...';
  }

  function newId() {
    return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---- rendering ---------------------------------------------------------

  function renderHistory() {
    els.history.innerHTML = '';

    if (state.conversations.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'history-empty';
      empty.textContent = 'No conversations yet. Start one with New Chat.';
      els.history.appendChild(empty);
      return;
    }

    state.conversations.forEach(function (conversation) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'history-item' + (conversation.id === state.activeId ? ' active' : '');
      item.textContent = conversation.title;
      item.title = conversation.title;
      item.setAttribute('data-id', conversation.id);
      item.addEventListener('click', function () {
        state.activeId = conversation.id;
        save();
        render();
      });
      els.history.appendChild(item);
    });
  }

  function renderMessages() {
    els.messages.innerHTML = '';
    var conversation = activeConversation();

    if (!conversation || conversation.messages.length === 0) {
      var hint = document.createElement('div');
      hint.className = 'messages-empty';
      hint.textContent = 'No messages yet. Type below to begin.';
      els.messages.appendChild(hint);
      return;
    }

    conversation.messages.forEach(function (message) {
      var bubble = document.createElement('div');
      bubble.className = 'msg ' + message.role;
      bubble.textContent = message.text;
      els.messages.appendChild(bubble);
    });

    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function render() {
    var conversation = activeConversation();
    els.title.textContent = conversation ? conversation.title : 'New conversation';
    renderHistory();
    renderMessages();
  }

  // ---- actions -----------------------------------------------------------

  function startNewChat() {
    state.activeId = null;
    save();
    render();
    els.input.value = '';
    els.input.focus();
  }

  function replyTo(text) {
    return 'Got it — this demo keeps your conversation in the browser on this device.';
  }

  function send() {
    var text = els.input.value.trim();
    if (!text) return;

    var conversation = activeConversation();
    if (!conversation) {
      conversation = { id: newId(), title: titleFrom(text), messages: [] };
      state.conversations.unshift(conversation);
      state.activeId = conversation.id;
    }

    conversation.messages.push({ role: 'user', text: text });
    conversation.messages.push({ role: 'assistant', text: replyTo(text) });

    els.input.value = '';
    els.input.style.height = '';
    save();
    render();
  }

  // ---- events ------------------------------------------------------------

  els.newChat.addEventListener('click', startNewChat);

  els.composer.addEventListener('submit', function (event) {
    event.preventDefault();
    send();
  });

  els.input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  });

  els.input.addEventListener('input', function () {
    els.input.style.height = 'auto';
    els.input.style.height = Math.min(els.input.scrollHeight, 160) + 'px';
  });

  // ---- boot --------------------------------------------------------------

  load();
  render();
  els.input.focus();
})();
