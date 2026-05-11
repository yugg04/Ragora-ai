(function () {
  var script = document.currentScript;
  if (!script) return;

  var widgetId = script.getAttribute("data-key") || script.getAttribute("data-widget-id");
  var apiBase = script.getAttribute("data-api-base") || new URL(script.src).origin;
  var triggerSelector = script.getAttribute("data-trigger-selector");
  var shortcutEnabled = script.getAttribute("data-shortcut") === "true";
  var requestedTheme = script.getAttribute("data-theme");
  if (!widgetId) return;

  function boot() {
    if (!document.body) {
      window.setTimeout(boot, 30);
      return;
    }

    var visitorKey = "rag_widget_visitor_id";
    var visitorId = localStorage.getItem(visitorKey);
    if (!visitorId) {
      visitorId = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(visitorKey, visitorId);
    }

    var state = {
      open: false,
      loading: false,
      config: {
        title: "Ask AI",
        welcome_message: "Hi. Ask me anything from these documents.",
        theme: "dark",
        accent_color: "#38bdf8",
        secondary_color: "#0f172a",
        logo_url: "",
        icon_label: "AI",
        launcher_style: "pill",
        border_radius: 14,
        launcher_label: "Chat with AI",
        input_placeholder: "Ask a question",
        position: "bottom-right",
      },
      messages: [],
    };

    var root = document.createElement("div");
    root.id = "rag-chat-widget-root-" + widgetId;
    document.body.appendChild(root);

    var style = document.createElement("style");
    style.textContent = [
      "#" + root.id + "{position:fixed;bottom:22px;z-index:2147483647;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}",
      "#" + root.id + ".ragw-pos-right{right:22px}",
      "#" + root.id + ".ragw-pos-left{left:22px}",
      "#" + root.id + " *{box-sizing:border-box}",
      ".ragw-launch{display:flex;align-items:center;gap:10px;height:56px;border:0;border-radius:999px;padding:0 18px 0 12px;cursor:pointer;box-shadow:0 18px 60px rgba(0,0,0,.35);color:#061014;font-weight:800;font-size:14px}",
      ".ragw-launch.circle{width:60px;padding:0;justify-content:center}.ragw-launch.circle span:last-child{display:none}",
      ".ragw-launch-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:999px;background:rgba(255,255,255,.62);font-size:13px;font-weight:900;overflow:hidden}",
      ".ragw-launch-icon img{width:100%;height:100%;object-fit:cover}",
      ".ragw-panel{width:min(390px,calc(100vw - 32px));height:min(640px,calc(100vh - 110px));margin-bottom:14px;border:1px solid rgba(148,163,184,.22);overflow:hidden;box-shadow:0 24px 90px rgba(0,0,0,.45);display:none}",
      ".ragw-panel.external-trigger{margin-bottom:0}",
      ".ragw-panel.open{display:flex;flex-direction:column}",
      ".ragw-dark{background:#0b0b0f;color:#f8fafc}.ragw-light{background:#ffffff;color:#111827}",
      ".ragw-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(148,163,184,.22)}",
      ".ragw-brand{display:flex;align-items:center;gap:10px}.ragw-brand-logo{display:grid;place-items:center;width:32px;height:32px;border-radius:999px;color:#061014;font-size:12px;font-weight:900;overflow:hidden}.ragw-brand-logo img{width:100%;height:100%;object-fit:cover}",
      ".ragw-title{font-size:15px;font-weight:700}.ragw-close{border:0;background:transparent;color:inherit;font-size:24px;cursor:pointer;line-height:1}",
      ".ragw-messages{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:10px}",
      ".ragw-msg{max-width:86%;white-space:pre-wrap;border-radius:12px;padding:10px 12px;font-size:14px;line-height:1.45}",
      ".ragw-bot{align-self:flex-start;background:rgba(148,163,184,.15)}.ragw-user{align-self:flex-end;color:#061014}",
      ".ragw-form{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(148,163,184,.22)}",
      ".ragw-input{flex:1;min-width:0;border:1px solid rgba(148,163,184,.28);border-radius:10px;background:transparent;color:inherit;padding:10px 11px;font-size:14px;outline:none}",
      ".ragw-send{border:0;border-radius:10px;color:#061014;font-weight:700;padding:0 14px;cursor:pointer}.ragw-send:disabled{opacity:.55;cursor:not-allowed}",
      "@media (max-width:520px){#" + root.id + "{left:12px;right:12px;bottom:12px}.ragw-panel{width:calc(100vw - 24px);height:calc(100vh - 92px)}}",
    ].join("");
    document.head.appendChild(style);

    function resolveTheme(configTheme) {
      var theme = requestedTheme || configTheme;
      if (theme === "auto") {
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      }
      return theme === "light" ? "light" : "dark";
    }

    function openChat() {
      state.open = true;
      render();
      var input = root.querySelector(".ragw-input");
      if (input) input.focus();
    }

    function toggleChat() {
      state.open = !state.open;
      render();
      if (state.open) {
        var input = root.querySelector(".ragw-input");
        if (input) input.focus();
      }
    }

    function setLogo(target) {
      target.textContent = "";
      if (state.config.logo_url) {
        var img = document.createElement("img");
        img.alt = "";
        img.referrerPolicy = "no-referrer";
        img.src = state.config.logo_url;
        target.appendChild(img);
        return;
      }
      target.textContent = state.config.icon_label || "AI";
    }

    function render() {
      var externalTrigger = Boolean(triggerSelector);
      var themeClass = resolveTheme(state.config.theme) === "light" ? "ragw-light" : "ragw-dark";
      root.className = state.config.position === "bottom-left" ? "ragw-pos-left" : "ragw-pos-right";
      root.innerHTML =
        '<div class="ragw-panel ' + themeClass + (externalTrigger ? " external-trigger" : "") + (state.open ? " open" : "") + '">' +
        '<div class="ragw-head"><div class="ragw-brand"><div class="ragw-brand-logo"></div><div class="ragw-title"></div></div><button class="ragw-close" aria-label="Close">x</button></div>' +
        '<div class="ragw-messages"></div>' +
        '<form class="ragw-form"><input class="ragw-input" autocomplete="off" /><button class="ragw-send" type="submit">Send</button></form>' +
        "</div>" +
        (externalTrigger ? "" : '<button class="ragw-launch" aria-label="Open chat"><span class="ragw-launch-icon"></span><span></span></button>');

      root.querySelector(".ragw-panel").style.borderRadius = state.config.border_radius + "px";
      root.querySelector(".ragw-title").textContent = state.config.title;
      var brandLogo = root.querySelector(".ragw-brand-logo");
      brandLogo.style.background = state.config.accent_color;
      setLogo(brandLogo);
      root.querySelector(".ragw-input").placeholder = state.config.input_placeholder;
      var launcher = root.querySelector(".ragw-launch");
      if (launcher) {
        launcher.style.background = state.config.accent_color;
        launcher.className = "ragw-launch " + state.config.launcher_style;
        setLogo(launcher.querySelector(".ragw-launch-icon"));
        launcher.querySelector("span:last-child").textContent = state.config.launcher_label;
        launcher.onclick = toggleChat;
      }
      root.querySelector(".ragw-send").style.background = state.config.accent_color;
      root.querySelector(".ragw-head").style.background = state.config.secondary_color;
      root.querySelector(".ragw-close").onclick = function () {
        state.open = false;
        render();
      };
      root.querySelector(".ragw-form").onsubmit = submitMessage;

      var messages = root.querySelector(".ragw-messages");
      state.messages.forEach(function (message) {
        addMessage(messages, message.text, message.role);
      });
    }

    function bindExternalTrigger() {
      if (!triggerSelector) return;
      document.addEventListener("click", function (event) {
        var target = event.target;
        if (!target || !target.closest) return;
        if (!target.closest(triggerSelector)) return;
        event.preventDefault();
        openChat();
      });
    }

    if (shortcutEnabled) {
      document.addEventListener("keydown", function (event) {
        var isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
        var modifier = isMac ? event.metaKey : event.ctrlKey;
        if (modifier && event.key.toLowerCase() === "k") {
          event.preventDefault();
          toggleChat();
        }
      });
    }

    function addMessage(container, text, role) {
      var div = document.createElement("div");
      div.className = "ragw-msg " + (role === "user" ? "ragw-user" : "ragw-bot");
      if (role === "user") div.style.background = state.config.accent_color;
      div.textContent = text;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      return div;
    }

    async function submitMessage(event) {
      event.preventDefault();
      if (state.loading) return;
      var input = root.querySelector(".ragw-input");
      var message = input.value.trim();
      if (!message) return;

      state.loading = true;
      input.value = "";
      var messages = root.querySelector(".ragw-messages");
      state.messages.push({ role: "user", text: message });
      state.messages.push({ role: "bot", text: "Thinking..." });
      addMessage(messages, message, "user");
      var answerNode = addMessage(messages, "Thinking...", "bot");
      var answer = "";

      try {
        var response = await fetch(apiBase + "/widgets/" + encodeURIComponent(widgetId) + "/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: message, visitor_id: visitorId, stream: true }),
        });
        if (!response.ok || !response.body) throw new Error("Chat request failed");

        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buffer = "";
        while (true) {
          var chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          var events = buffer.split("\n\n");
          buffer = events.pop() || "";
          for (var i = 0; i < events.length; i += 1) {
            var eventText = events[i];
            var eventLine = eventText.split("\n").find(function (line) { return line.indexOf("event: ") === 0; });
            var dataLine = eventText.split("\n").find(function (line) { return line.indexOf("data: ") === 0; });
            if (!dataLine) continue;
            var data = dataLine.slice(6);
            if (data === "[DONE]") continue;
            if (eventLine && eventLine.slice(7) === "error") throw new Error(JSON.parse(data));
            var parsed = JSON.parse(data);
            if (typeof parsed === "string") {
              answer += parsed;
              answerNode.textContent = answer;
              state.messages[state.messages.length - 1].text = answer;
            }
          }
        }
      } catch (error) {
        answerNode.textContent = error && error.message ? error.message : "I could not answer right now.";
        state.messages[state.messages.length - 1].text = answerNode.textContent;
      } finally {
        state.loading = false;
      }
    }

    fetch(apiBase + "/widgets/" + encodeURIComponent(widgetId) + "/config")
      .then(function (response) { return response.ok ? response.json() : state.config; })
      .then(function (config) {
        state.config = Object.assign(state.config, config);
        state.messages = [{ role: "bot", text: state.config.welcome_message }];
        render();
        bindExternalTrigger();
      })
      .catch(function () {
        state.messages = [{ role: "bot", text: state.config.welcome_message }];
        render();
        bindExternalTrigger();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
