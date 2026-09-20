(function () {
  "use strict";

  // ====================== CONFIG ======================
  const CONFIG = {
    whatsapp: "254768741052",
    company: "Infinite Cyberspace Hub",
    apiEndpoint: "/api/chat",
    enableRealAI: true               
  };

  // ====================== STATE ======================
  let knowledge = null;
  let messages = [];
  let isOpen = false;
  let isTyping = false;
  const convId = localStorage.getItem("ich_conv") || crypto.randomUUID();
  localStorage.setItem("ich_conv", convId);

  // ====================== LOAD KNOWLEDGE ======================
  async function loadKnowledge() {
    try {
      const res = await fetch("./ai-knowledge.json");
      knowledge = await res.json();
    } catch (e) {
      console.warn("Knowledge base not found");
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
        font-size: 14.5px; line-height: 1.55; position: relative;
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
        font-size: 14.5px; outline: none; transition: border 0.2s;
      }
      #ich-input:focus { border-color: #06b6d4; }
      #ich-send {
        width: 48px; background: #06b6d4; border: none;
        border-radius: 14px; color: #000; font-size: 18px;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
      #ich-send:hover { background: #22d3ee; }

      .ich-feedback {
        display: flex; gap: 6px; margin-top: 8px;
      }
      .ich-feedback button {
        background: transparent; border: 1px solid #3f3f46;
        color: #71717a; border-radius: 8px; padding: 2px 9px;
        font-size: 12px; cursor: pointer;
      }
      .ich-feedback button:hover { border-color: #06b6d4; color: #06b6d4; }
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
          <h3>Infinite Cyber AI</h3>
          <p>Cybersecurity + IT Support</p>
        </div>
        <button onclick="document.getElementById('ich-window').style.display='none'; document.getElementById('ich-launcher').classList.remove('open')" 
                style="background:transparent;border:none;color:white;font-size:22px;cursor:pointer;line-height:1">×</button>
      </div>
      <div id="ich-messages"></div>
      <div id="ich-input-area">
        <input id="ich-input" placeholder="Ask about IT Support, packages, security..." autocomplete="off" />
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

    setTimeout(() => {
      botReply(getWelcomeMessage(), [
        { label: "IT Support", value: "Tell me about IT Support" },
        { label: "View Packages", value: "Show me the packages" },
        { label: "Free Consultation", value: "I want a free consultation" },
        { label: "Talk to Human", value: "I want to speak to someone" }
      ]);
    }, 700);
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

    const fb = document.createElement("div");
    fb.className = "ich-feedback";
    fb.innerHTML = `
      <button onclick="this.parentElement.innerHTML='✅ Thanks!'">👍 Helpful</button>
      <button onclick="this.parentElement.innerHTML='📝 We’ll improve'">👎</button>
    `;
    div.appendChild(fb);

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

  // ====================== CORE BRAIN ======================
  function getWelcomeMessage() {
    const hour = new Date().getHours();
    let greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return `${greeting}! 👋 I'm the AI assistant of <strong>Infinite Cyberspace Hub</strong>.<br><br>
    I can help you with both <strong>Cybersecurity</strong> and <strong>IT Support</strong>.<br><br>
    How can I assist you today?`;
  }

  async function handleSend() {
    const input = document.getElementById("ich-input");
    const text = input.value.trim();
    if (!text || isTyping) return;

    addUserBubble(text);
    input.value = "";
    messages.push({ role: "user", content: text });

    showTyping();
    await new Promise(r => setTimeout(r, 600 + Math.random() * 700));

    const reply = await generateReply(text);
    botReply(reply.text, reply.quick || []);
    messages.push({ role: "assistant", content: reply.text });
    saveConversation();
  }

  async function generateReply(userText) {
    if (CONFIG.enableRealAI) {
      try {
        const res = await fetch(CONFIG.apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userText, history: messages.slice(-8), knowledge })
        });
        if (res.ok) {
          const data = await res.json();
          return { text: data.reply };
        }
      } catch (e) {}
    }
    return smartLocalEngine(userText);
  }

  function smartLocalEngine(text) {
    const t = text.toLowerCase();

    // Urgent security
    if (/(hack|breach|ransomware|attack|compromised|urgent|emergency|incident|malware)/.test(t)) {
      return {
        text: `⚠️ This sounds serious.<br><br>Please contact us <strong>immediately</strong>:<br><br>
        <a href="https://wa.me/${CONFIG.whatsapp}?text=URGENT%20security%20incident" target="_blank" style="color:#22d3ee;font-weight:600">→ Open WhatsApp Now</a><br><br>
        Critical response target: under 15 minutes.`,
        quick: [{ label: "Open WhatsApp", value: "I need urgent help" }]
      };
    }

    // IT Support
    if (/(it support|technical support|computer|laptop|printer|wifi|network|email|outlook|microsoft 365|google workspace|backup|server|remote support|on.?site|hardware|software|slow|not working|help desk)/.test(t)) {
      return {
        text: `Yes — we provide complete <strong>Managed IT Support</strong>.<br><br>
        What we cover:<br>
        • Remote desktop support (fast)<br>
        • On-site support (Kisumu & nearby)<br>
        • Network, Wi-Fi & printer issues<br>
        • Microsoft 365 / Google Workspace<br>
        • Backups & disaster recovery<br>
        • Server & workstation maintenance<br>
        • Proactive monitoring<br><br>
        Do you need help right now, or would you like to see our support packages?`,
        quick: [
          { label: "Need help now", value: "I need IT support right now" },
          { label: "View Packages", value: "Show packages" },
          { label: "Talk to Technician", value: "I want to speak to someone" }
        ]
      };
    }

    // Package recommendation
    if (/(which package|recommend|best for|suitable|small business|sme|startup)/.test(t)) {
      return {
        text: `Here's my recommendation:<br><br>
        • <strong>Small business / Startup</strong> → <strong>Basic</strong> (KES 12,900)<br>
        • <strong>Growing company</strong> → <strong>Standard</strong> (KES 25,900) ★ Most popular<br>
          (Includes 24/7 SOC + Priority IT Support)<br>
        • <strong>Larger organization</strong> → <strong>Premium</strong> (KES 38,900)<br><br>
        Would you like me to explain any package in detail?`,
        quick: [
          { label: "Standard details", value: "Tell me about Standard package" },
          { label: "Basic details", value: "Tell me about Basic package" },
          { label: "Book consultation", value: "I want a free consultation" }
        ]
      };
    }

    // Packages / Pricing
    if (/(package|plan|price|cost|how much|pricing)/.test(t)) {
      return {
        text: `Our current packages:<br><br>
        <strong>1. Basic</strong> – KES 12,900/mo<br>
        Best for small businesses<br><br>
        <strong>2. Standard</strong> – KES 25,900/mo ★ Most Popular<br>
        24/7 SOC + XDR + Priority IT Support<br><br>
        <strong>3. Premium</strong> – KES 38,900/mo<br>
        Full protection + dedicated technician<br><br>
        Would you like a recommendation based on your business size?`,
        quick: [
          { label: "Recommend for me", value: "Which package is best for a small business?" },
          { label: "Standard details", value: "Tell me about Standard package" },
          { label: "Book consultation", value: "I want a free consultation" }
        ]
      };
    }

    // Free consultation / Talk to human
    if (/(free|consultation|book|demo|talk|speak|human|person|call|technician)/.test(t)) {
      return {
        text: `You can reach us instantly:<br><br>
        <a href="https://wa.me/${CONFIG.whatsapp}?text=Hello%20Infinite%20Cyberspace%2C%20I%20need%20help" 
           target="_blank" style="color:#22d3ee;font-weight:600">→ Chat on WhatsApp</a><br><br>
        Or call: <strong>+254 768 741 052</strong><br><br>
        We respond very fast.`,
        quick: [
          { label: "Open WhatsApp", value: "Connect me on WhatsApp" },
          { label: "View Packages", value: "Show packages" }
        ]
      };
    }

    // Services overview
    if (/(service|what do you|offer|protect|solution)/.test(t)) {
      return {
        text: `We offer both <strong>Cybersecurity</strong> and <strong>IT Support</strong>:<br><br>
        <strong>Cybersecurity</strong><br>
        • 24/7 SOC Monitoring<br>
        • Zero-Trust & Firewalls<br>
        • Endpoint & Cloud Protection<br>
        • Penetration Testing<br>
        • Security Awareness Training<br><br>
        <strong>IT Support</strong><br>
        • Remote & On-site support<br>
        • Network, email, printers, backups<br>
        • Proactive maintenance<br><br>
        Which area interests you most?`,
        quick: [
          { label: "IT Support", value: "Tell me about IT Support" },
          { label: "24/7 SOC", value: "Tell me about SOC monitoring" },
          { label: "Packages", value: "Show packages" }
        ]
      };
    }

    // Location
    if (/(where|location|based|kisumu|office)/.test(t)) {
      return {
        text: `We are based in <strong>Kisumu, Kenya</strong> and serve clients across the country.<br><br>
        Local team • Fast response • On-site IT support available.`,
        quick: [
          { label: "IT Support", value: "Tell me about IT Support" },
          { label: "Free consultation", value: "I want a free consultation" }
        ]
      };
    }

    // Default
    return {
      text: `I can help you with both <strong>Cybersecurity</strong> and <strong>IT Support</strong>.<br><br>
      Ask me about services, packages, pricing, or just tell me the problem you're facing.`,
      quick: [
        { label: "IT Support", value: "Tell me about IT Support" },
        { label: "Show Packages", value: "Show packages" },
        { label: "Talk to Human", value: "I want to speak to someone" }
      ]
    };
  }

  function saveConversation() {
    const history = JSON.parse(localStorage.getItem("ich_history") || "[]");
    history.push({
      id: convId,
      messages: messages.slice(-12),
      time: new Date().toISOString(),
      page: location.pathname
    });
    localStorage.setItem("ich_history", JSON.stringify(history.slice(-30)));
  }

  // ====================== INIT ======================
  document.addEventListener("DOMContentLoaded", async () => {
    injectStyles();
    await loadKnowledge();
    createWidget();
  });
})();