(function () {
  "use strict";

  // ====================== CONFIG ======================
  const CONFIG = {
    whatsapp: "254768741052",
    company: "Infinite Cyberspace Hub",
    aiName: "Asha",
    apiEndpoint: "/api/chat",
    enableRealAI: false               // set to true later when backend is ready
  };

  // ====================== STATE ======================
  let knowledge = null;
  let messages = [];
  let isOpen = false;
  let isTyping = false;
  let userInfo = {
    name: null,
    company: null,
    need: null
  };

  const convId = localStorage.getItem("ich_conv") || crypto.randomUUID();
  localStorage.setItem("ich_conv", convId);

  // Load saved user info if available
  const savedInfo = localStorage.getItem("ich_user_info");
  if (savedInfo) {
    userInfo = JSON.parse(savedInfo);
  }

  // ====================== LOAD KNOWLEDGE ======================
  async function loadKnowledge() {
    try {
      const res = await fetch("./ai-knowledge.json");
      knowledge = await res.json();
    } catch (e) {
      knowledge = { company: { name: CONFIG.company } };
    }
  }

  // ====================== STYLES ======================
  function injectStyles() {
    const css = `
      #ich-launcher {
        position: fixed; bottom: 28px; right: 28px; z-index: 99999;
        width: 64px; height: 64px; border-radius: 50%;
        background: linear-gradient(135deg, #06b6d4, #0891b2);
        box-shadow: 0 10px 30px rgba(6,182,212,0.45);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; border: none; color: white; font-size: 28px;
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      #ich-launcher:hover { transform: scale(1.1); }
      #ich-launcher.open { transform: rotate(90deg); background: #ef4444; }

      #ich-window {
        position: fixed; bottom: 110px; right: 28px; z-index: 99998;
        width: 400px; max-width: calc(100vw - 24px); height: 620px;
        max-height: calc(100vh - 140px);
        background: #09090b; border: 1px solid rgba(6,182,212,0.25);
        border-radius: 24px; display: none; flex-direction: column;
        box-shadow: 0 25px 60px rgba(0,0,0,0.7);
        overflow: hidden; font-family: 'Inter', system-ui, sans-serif;
        animation: ichSlideUp 0.3s ease;
      }
      @keyframes ichSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      #ich-header {
        background: linear-gradient(90deg, #0e7490, #0891b2);
        padding: 18px 20px; color: white;
        display: flex; justify-content: space-between; align-items: center;
      }
      #ich-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
      #ich-header p { margin: 2px 0 0; font-size: 12px; opacity: 0.9; }

      #ich-messages {
        flex: 1; overflow-y: auto; padding: 20px 18px;
        display: flex; flex-direction: column; gap: 16px;
        scroll-behavior: smooth;
      }

      .ich-bubble {
        max-width: 88%; padding: 13px 17px; border-radius: 18px;
        font-size: 14.5px; line-height: 1.55;
      }
      .ich-bubble.bot {
        background: #18181b; color: #e4e4e7;
        border: 1px solid #27272a; align-self: flex-start;
        border-bottom-left-radius: 6px;
      }
      .ich-bubble.user {
        background: linear-gradient(135deg, #0891b2, #06b6d4);
        color: white; align-self: flex-end;
        border-bottom-right-radius: 6px;
      }

      .ich-quick {
        display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;
      }
      .ich-quick button {
        background: rgba(6,182,212,0.12); border: 1px solid rgba(6,182,212,0.35);
        color: #22d3ee; padding: 7px 14px; border-radius: 999px;
        font-size: 13px; cursor: pointer; transition: all 0.2s;
      }
      .ich-quick button:hover {
        background: rgba(6,182,212,0.25); transform: translateY(-1px);
      }

      .ich-typing {
        display: flex; gap: 5px; padding: 14px 18px;
        background: #18181b; border-radius: 18px; width: fit-content;
        border: 1px solid #27272a;
      }
      .ich-typing span {
        width: 7px; height: 7px; background: #06b6d4; border-radius: 50%;
        animation: ichBounce 1.2s infinite ease-in-out;
      }
      .ich-typing span:nth-child(2) { animation-delay: 0.15s; }
      .ich-typing span:nth-child(3) { animation-delay: 0.3s; }
      @keyframes ichBounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-6px); }
      }

      #ich-input-area {
        padding: 16px; border-top: 1px solid #27272a;
        background: #09090b; display: flex; gap: 10px;
      }
      #ich-input {
        flex: 1; background: #18181b; border: 1px solid #3f3f46;
        border-radius: 14px; padding: 13px 16px; color: white;
        font-size: 14.5px; outline: none;
      }
      #ich-input:focus { border-color: #06b6d4; }
      #ich-send {
        width: 48px; background: #06b6d4; border: none;
        border-radius: 14px; color: #000; font-size: 18px;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
      #ich-send:hover { background: #22d3ee; }
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ====================== CREATE WIDGET ======================
  function createWidget() {
    const launcher = document.createElement("button");
    launcher.id = "ich-launcher";
    launcher.innerHTML = `<i class="fas fa-comment-dots"></i>`;
    launcher.onclick = toggle;
    document.body.appendChild(launcher);

    const win = document.createElement("div");
    win.id = "ich-window";
    win.innerHTML = `
      <div id="ich-header">
        <div>
          <h3>Asha • Infinite Cyber</h3>
          <p>Cybersecurity & IT Support Assistant</p>
        </div>
        <button onclick="document.getElementById('ich-window').style.display='none'; document.getElementById('ich-launcher').classList.remove('open')" 
                style="background:transparent;border:none;color:white;font-size:22px;cursor:pointer">×</button>
      </div>
      <div id="ich-messages"></div>
      <div id="ich-input-area">
        <input id="ich-input" placeholder="Type your message..." autocomplete="off" />
        <button id="ich-send"><i class="fas fa-paper-plane"></i></button>
      </div>
    `;
    document.body.appendChild(win);

    document.getElementById("ich-send").onclick = handleSend;
    document.getElementById("ich-input").addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // First message
    setTimeout(() => {
      startConversation();
    }, 600);
  }

  function toggle() {
    const win = document.getElementById("ich-window");
    const btn = document.getElementById("ich-launcher");
    isOpen = !isOpen;
    win.style.display = isOpen ? "flex" : "none";
    btn.classList.toggle("open", isOpen);
    if (isOpen) document.getElementById("ich-input").focus();
  }

  // ====================== MESSAGE HELPERS ======================
  function addUserBubble(text) {
    const box = document.getElementById("ich-messages");
    const div = document.createElement("div");
    div.className = "ich-bubble user";
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function showTyping() {
    if (isTyping) return;
    isTyping = true;
    const box = document.getElementById("ich-messages");
    const div = document.createElement("div");
    div.className = "ich-typing";
    div.id = "ich-typing";
    div.innerHTML = `<span></span><span></span><span></span>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function hideTyping() {
    isTyping = false;
    document.getElementById("ich-typing")?.remove();
  }

  function botReply(text, quickReplies = []) {
    hideTyping();
    const box = document.getElementById("ich-messages");
    const div = document.createElement("div");
    div.className = "ich-bubble bot";
    div.innerHTML = text.replace(/\n/g, "<br>");

    if (quickReplies.length) {
      const q = document.createElement("div");
      q.className = "ich-quick";
      quickReplies.forEach(r => {
        const b = document.createElement("button");
        b.textContent = r.label;
        b.onclick = () => {
          document.getElementById("ich-input").value = r.value;
          handleSend();
        };
        q.appendChild(b);
      });
      div.appendChild(q);
    }

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  // ====================== CONVERSATION FLOW ======================
  function startConversation() {
    if (userInfo.name) {
      botReply(`Welcome back, <strong>${userInfo.name}</strong>! 👋<br><br>How can I help you today with cybersecurity or IT support?`, [
        { label: "IT Support", value: "I need IT support" },
        { label: "Cybersecurity", value: "I need cybersecurity help" },
        { label: "Packages", value: "Show me packages" },
        { label: "Talk to human", value: "I want to speak to someone" }
      ]);
    } else {
      botReply(`Hello! 👋<br><br>I'm <strong>Asha</strong>, your assistant from Infinite Cyberspace Hub.<br><br>I help Kenyan businesses with <strong>Cybersecurity</strong> and <strong>IT Support</strong>.<br><br>May I know your name?`);
    }
  }

  async function handleSend() {
    const input = document.getElementById("ich-input");
    const text = input.value.trim();
    if (!text || isTyping) return;

    addUserBubble(text);
    input.value = "";
    messages.push({ role: "user", content: text });

    showTyping();
    await new Promise(r => setTimeout(r, 700 + Math.random() * 600));

    const reply = processMessage(text);
    botReply(reply.text, reply.quick || []);
    messages.push({ role: "assistant", content: reply.text });

    // Save user info
    localStorage.setItem("ich_user_info", JSON.stringify(userInfo));
  }

  function processMessage(text) {
    const t = text.toLowerCase().trim();

    // ===== Step 1: Collect Name =====
    if (!userInfo.name) {
      // Simple name extraction
      let name = text.replace(/(my name is|i am|i'm|this is|call me)/i, "").trim();
      name = name.split(" ")[0]; // take first word
      name = name.charAt(0).toUpperCase() + name.slice(1);

      if (name.length > 1 && name.length < 20) {
        userInfo.name = name;
        return {
          text: `Nice to meet you, <strong>${userInfo.name}</strong>! 😊<br><br>Are you reaching out for yourself or on behalf of a company?`,
          quick: [
            { label: "For my company", value: "For my company" },
            { label: "Just for myself", value: "Just for myself" }
          ]
        };
      } else {
        return {
          text: `Sorry, I didn’t catch your name clearly.<br><br>Could you please tell me your first name?`
        };
      }
    }

    // ===== Step 2: Company =====
    if (!userInfo.company && /(company|business|organization|for my company)/.test(t)) {
      userInfo.company = "Company";
      return {
        text: `Got it. What’s the name of your company, ${userInfo.name}?`,
      };
    }

    if (userInfo.company === "Company" && text.length > 2) {
      userInfo.company = text;
      return {
        text: `Thank you! So you're from <strong>${userInfo.company}</strong>.<br><br>What can I help you with today?`,
        quick: [
          { label: "IT Support", value: "I need IT support" },
          { label: "Cybersecurity", value: "I need cybersecurity protection" },
          { label: "Both", value: "I need both IT and cybersecurity" },
          { label: "Just exploring", value: "I'm just exploring" }
        ]
      };
    }

    // ===== Main Intent Detection =====
    // Urgent
    if (/(hack|breach|ransomware|attack|urgent|emergency|incident)/.test(t)) {
      return {
        text: `${userInfo.name}, this sounds urgent.<br><br>Please contact us immediately on WhatsApp for the fastest help:<br><br>
        <a href="https://wa.me/${CONFIG.whatsapp}?text=URGENT%20-%20${userInfo.name}" target="_blank" style="color:#22d3ee;font-weight:600">→ Open WhatsApp Now</a>`,
        quick: [{ label: "Open WhatsApp", value: "Connect me on WhatsApp" }]
      };
    }

    // IT Support
    if (/(it support|technical|computer|laptop|printer|wifi|network|email|outlook|slow|not working|remote|on.?site)/.test(t)) {
      userInfo.need = "IT Support";
      return {
        text: `Understood, ${userInfo.name}. You need IT Support.<br><br>
        We offer both <strong>remote</strong> and <strong>on-site</strong> support here in Kisumu and across Kenya.<br><br>
        Would you like me to recommend the best option for you, or would you prefer to speak with a technician directly?`,
        quick: [
          { label: "Recommend best option", value: "Recommend the best option for me" },
          { label: "Speak to technician", value: "I want to speak to a technician" },
          { label: "View packages", value: "Show packages" }
        ]
      };
    }

    // Cybersecurity
    if (/(cyber|security|protect|soc|firewall|endpoint|penetration|awareness)/.test(t)) {
      userInfo.need = "Cybersecurity";
      return {
        text: `Got it, ${userInfo.name}. You're looking for Cybersecurity protection.<br><br>
        We have three main packages designed for Kenyan businesses.<br><br>
        Would you like me to recommend the most suitable one based on your needs?`,
        quick: [
          { label: "Yes, recommend", value: "Recommend the best package" },
          { label: "Show all packages", value: "Show packages" },
          { label: "Talk to expert", value: "I want to speak to someone" }
        ]
      };
    }

    // Recommendation request
    if (/(recommend|best option|best package|which one|suitable)/.test(t)) {
      return {
        text: `${userInfo.name}, based on what you've told me, I recommend starting with the <strong>Standard Protection</strong> package (KES 25,900/month).<br><br>
        It includes:<br>
        • 24/7 SOC Monitoring<br>
        • XDR Protection<br>
        • Priority IT Support<br><br>
        This is our most popular choice for growing businesses.<br><br>
        Would you like to book a free consultation to discuss it further?`,
        quick: [
          { label: "Book Free Consultation", value: "I want a free consultation" },
          { label: "Tell me about Basic", value: "Tell me about Basic package" },
          { label: "Talk on WhatsApp", value: "Connect me on WhatsApp" }
        ]
      };
    }

    // Packages
    if (/(package|plan|price|pricing|cost)/.test(t)) {
      return {
        text: `Here are our current packages, ${userInfo.name}:<br><br>
        <strong>Basic</strong> – KES 12,900/mo<br>
        <strong>Standard</strong> – KES 25,900/mo ★ Most Popular<br>
        <strong>Premium</strong> – KES 38,900/mo<br><br>
        Would you like me to recommend the best one for you?`,
        quick: [
          { label: "Recommend for me", value: "Recommend the best package" },
          { label: "Book consultation", value: "I want a free consultation" }
        ]
      };
    }

    // Talk to human / WhatsApp
    if (/(human|person|technician|call|whatsapp|speak|talk)/.test(t)) {
      return {
        text: `Of course, ${userInfo.name}.<br><br>
        You can reach Augustine or the team directly here:<br><br>
        <a href="https://wa.me/${CONFIG.whatsapp}?text=Hello%2C%20my%20name%20is%20${userInfo.name}" target="_blank" style="color:#22d3ee;font-weight:600">→ Chat on WhatsApp</a><br><br>
        Or call: <strong>+254 768 741 052</strong>`,
        quick: [
          { label: "Open WhatsApp", value: "Connect me on WhatsApp" }
        ]
      };
    }

    // Default friendly reply
    return {
      text: `I'm here to help, ${userInfo.name}.<br><br>
      You can tell me if you need <strong>IT Support</strong>, <strong>Cybersecurity</strong>, or if you're just exploring our services.`,
      quick: [
        { label: "IT Support", value: "I need IT support" },
        { label: "Cybersecurity", value: "I need cybersecurity" },
        { label: "Show packages", value: "Show packages" },
        { label: "Talk to human", value: "I want to speak to someone" }
      ]
    };
  }

  // ====================== INIT ======================
  document.addEventListener("DOMContentLoaded", async () => {
    injectStyles();
    await loadKnowledge();
    createWidget();
  });
})();