(function () {
  "use strict";

  // ====================== CONFIG ======================
  const CONFIG = {
    whatsapp: "254768741052",
    company: "Infinite Cyberspace Hub",
    aiName: "Asha",
    apiEndpoint: "/api/chat",
    enableRealAI: false,          // ← set true when you upgrade to real AI
    knowledgeUrl: "./ai-knowledge.json"
  };

  // ====================== STATE ======================
  let knowledge = null;
  let messages = [];
  let isOpen = false;
  let isTyping = false;
  let hasRated = localStorage.getItem("ich_has_rated") === "true";
  let conversationEnded = false;

  let userInfo = {
    name: null,
    company: null,
    need: null,
    size: null,
    tools: null,
    industry: null
  };

  let conversationMetrics = {
    messages: 0,
    topics: new Set(),
    startedAt: Date.now()
  };

  try {
    const saved = localStorage.getItem("ich_user_info");
    if (saved) userInfo = { ...userInfo, ...JSON.parse(saved) };
  } catch (e) {}

  // ====================== LOAD KNOWLEDGE ======================
  async function loadKnowledge() {
    try {
      const res = await fetch(CONFIG.knowledgeUrl);
      knowledge = await res.json();
    } catch (e) {
      knowledge = {
        company: { name: CONFIG.company, phone: "+254 768 741 052" },
        services: [
          { id: "soc", name: "24/7 SOC Monitoring", short: "Round-the-clock threat detection with <15 min critical response" },
          { id: "zerotrust", name: "Zero-Trust & Firewall", short: "Modern identity-based access and network segmentation" },
          { id: "endpoint", name: "Endpoint & Cloud Protection", short: "EDR/XDR for devices, Microsoft 365, Azure & AWS" },
          { id: "pentest", name: "Penetration Testing", short: "Real-world attack simulations with clear remediation plans" },
          { id: "awareness", name: "Security Awareness Training", short: "Phishing simulations + practical employee training" },
          { id: "it", name: "Managed IT Support", short: "Remote & on-site support, network, backups & proactive maintenance" }
        ],
        packages: []
      };
    }
  }

  // ====================== STYLES (Premium Futuristic) ======================
  function injectStyles() {
    if (document.getElementById("ich-styles")) return;

    const css = `
      #ich-launcher {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 99999;
        width: 68px;
        height: 68px;
        border-radius: 50%;
        background: linear-gradient(145deg, #0e7490, #06b6d4, #22d3ee);
        box-shadow:
          0 8px 32px rgba(6, 182, 212, 0.5),
          0 0 0 1px rgba(255,255,255,0.12),
          inset 0 1px 0 rgba(255,255,255,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border: none;
        color: white;
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
      }
      #ich-launcher::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.28), transparent 60%);
        border-radius: 50%;
        pointer-events: none;
      }
      #ich-launcher:hover {
        transform: scale(1.12) translateY(-3px);
        box-shadow:
          0 16px 44px rgba(6, 182, 212, 0.6),
          0 0 0 1px rgba(255,255,255,0.18),
          inset 0 1px 0 rgba(255,255,255,0.3);
      }
      #ich-launcher.open {
        transform: rotate(90deg) scale(1.05);
        background: linear-gradient(145deg, #ef4444, #f87171);
        box-shadow: 0 8px 32px rgba(239, 68, 68, 0.5);
      }
      #ich-launcher svg {
        width: 30px;
        height: 30px;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25));
        transition: transform 0.3s ease;
      }
      #ich-launcher:hover svg { transform: scale(1.1); }

      #ich-window {
        position: fixed;
        bottom: 115px;
        right: 28px;
        z-index: 99998;
        width: 420px;
        max-width: calc(100vw - 20px);
        height: 680px;
        max-height: calc(100vh - 140px);
        background: rgba(9, 9, 11, 0.92);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(6, 182, 212, 0.28);
        border-radius: 28px;
        display: none;
        flex-direction: column;
        box-shadow:
          0 30px 70px rgba(0,0,0,0.75),
          0 0 0 1px rgba(255,255,255,0.04),
          0 0 80px rgba(6, 182, 212, 0.08);
        overflow: hidden;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        animation: ichSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      }
      @keyframes ichSlideUp {
        from { opacity: 0; transform: translateY(28px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      #ich-header {
        background: linear-gradient(105deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%);
        padding: 18px 22px;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        overflow: hidden;
      }
      #ich-header::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
        pointer-events: none;
      }
      #ich-header h3 {
        margin: 0;
        font-size: 16.5px;
        font-weight: 650;
        letter-spacing: -0.3px;
      }
      #ich-header p {
        margin: 3px 0 0;
        font-size: 12.5px;
        opacity: 0.92;
      }

      #ich-messages {
        flex: 1;
        overflow-y: auto;
        padding: 22px 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        scroll-behavior: smooth;
        background: radial-gradient(ellipse at top, rgba(6,182,212,0.04), transparent 60%);
      }

      .ich-bubble {
        max-width: 90%;
        padding: 14px 18px;
        border-radius: 20px;
        font-size: 14.5px;
        line-height: 1.55;
      }
      .ich-bubble.bot {
        background: rgba(24, 24, 27, 0.9);
        color: #e4e4e7;
        border: 1px solid rgba(39, 39, 42, 0.9);
        align-self: flex-start;
        border-bottom-left-radius: 6px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      }
      .ich-bubble.user {
        background: linear-gradient(135deg, #0891b2, #06b6d4);
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 6px;
        box-shadow: 0 6px 20px rgba(6, 182, 212, 0.35);
      }

      .ich-quick {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }
      .ich-quick button {
        background: rgba(6, 182, 212, 0.12);
        border: 1px solid rgba(6, 182, 212, 0.35);
        color: #22d3ee;
        padding: 8px 15px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.22s ease;
      }
      .ich-quick button:hover {
        background: rgba(6, 182, 212, 0.25);
        transform: translateY(-2px);
        border-color: rgba(6, 182, 212, 0.6);
        box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
      }

      .ich-service-card {
        background: rgba(6, 182, 212, 0.08);
        border: 1px solid rgba(6, 182, 212, 0.25);
        border-radius: 14px;
        padding: 12px 14px;
        margin: 6px 0;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .ich-service-card:hover {
        background: rgba(6, 182, 212, 0.16);
        border-color: rgba(6, 182, 212, 0.45);
        transform: translateX(4px);
      }
      .ich-service-card strong {
        color: #22d3ee;
        display: block;
        margin-bottom: 3px;
      }
      .ich-service-card span {
        font-size: 12.5px;
        color: #a1a1aa;
      }

      .ich-typing {
        display: flex;
        gap: 5px;
        padding: 14px 18px;
        background: rgba(24, 24, 27, 0.9);
        border-radius: 18px;
        width: fit-content;
        border: 1px solid #27272a;
      }
      .ich-typing span {
        width: 7px;
        height: 7px;
        background: #06b6d4;
        border-radius: 50%;
        animation: ichBounce 1.2s infinite ease-in-out;
      }
      .ich-typing span:nth-child(2) { animation-delay: 0.15s; }
      .ich-typing span:nth-child(3) { animation-delay: 0.3s; }
      @keyframes ichBounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-6px); }
      }

      #ich-input-area {
        padding: 16px 18px;
        border-top: 1px solid rgba(39, 39, 42, 0.8);
        background: rgba(9, 9, 11, 0.95);
        display: flex;
        gap: 10px;
      }
      #ich-input {
        flex: 1;
        background: #18181b;
        border: 1px solid #3f3f46;
        border-radius: 16px;
        padding: 14px 18px;
        color: white;
        font-size: 14.5px;
        outline: none;
        transition: all 0.2s;
      }
      #ich-input:focus {
        border-color: #06b6d4;
        box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.18);
      }
      #ich-send {
        width: 52px;
        background: linear-gradient(135deg, #06b6d4, #22d3ee);
        border: none;
        border-radius: 16px;
        color: #000;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      #ich-send:hover {
        background: linear-gradient(135deg, #22d3ee, #67e8f9);
        transform: scale(1.06);
      }

      .ich-rating-box {
        background: rgba(24, 24, 27, 0.95);
        border: 1px solid #27272a;
        border-radius: 16px;
        padding: 16px;
        margin-top: 8px;
        text-align: center;
      }
      .ich-stars {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin: 12px 0;
        font-size: 28px;
        cursor: pointer;
      }
      .ich-stars span {
        color: #3f3f46;
        transition: color 0.2s, transform 0.2s;
      }
      .ich-stars span:hover,
      .ich-stars span.active {
        color: #fbbf24;
        transform: scale(1.18);
      }

      a.ich-wa-link {
        color: #22d3ee;
        font-weight: 600;
        text-decoration: none;
        border-bottom: 1px solid rgba(34, 211, 238, 0.4);
      }
      a.ich-wa-link:hover { border-bottom-color: #22d3ee; }

      @media (max-width: 480px) {
        #ich-window {
          right: 10px;
          left: 10px;
          width: auto;
          bottom: 100px;
          height: 75vh;
        }
        #ich-launcher { bottom: 20px; right: 20px; }
      }
    `;

    const style = document.createElement("style");
    style.id = "ich-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ====================== CREATE WIDGET ======================
  function createWidget() {
    const launcher = document.createElement("button");
    launcher.id = "ich-launcher";
    launcher.setAttribute("aria-label", "Open chat with Asha");
    launcher.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" 
              fill="currentColor" fill-opacity="0.95"/>
        <path d="M12 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" 
              fill="#0e7490"/>
        <path d="M8.5 15.5c0-1.5 1.5-2.5 3.5-2.5s3.5 1 3.5 2.5" 
              stroke="#0e7490" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    `;
    launcher.onclick = toggle;
    document.body.appendChild(launcher);

    const win = document.createElement("div");
    win.id = "ich-window";
    win.innerHTML = `
      <div id="ich-header">
        <div>
          <h3>Asha • Cybersecurity Specialist</h3>
          <p>Infinite Cyberspace Hub · Kisumu · Online</p>
        </div>
        <button onclick="document.getElementById('ich-window').style.display='none'; document.getElementById('ich-launcher').classList.remove('open')"
                style="background:transparent;border:none;color:white;font-size:24px;cursor:pointer;line-height:1;opacity:0.9;transition:opacity 0.2s"
                onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.9">×</button>
      </div>
      <div id="ich-messages"></div>
      <div id="ich-input-area">
        <input id="ich-input" placeholder="Ask about security, IT support or digital innovation..." autocomplete="off" />
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

    setTimeout(() => startConversation(), 650);
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

  function saveUserInfo() {
    localStorage.setItem("ich_user_info", JSON.stringify(userInfo));
  }

  function trackTopic(topic) {
    conversationMetrics.topics.add(topic);
    conversationMetrics.messages++;
  }

  // ====================== WHATSAPP HELPER ======================
  function waLink(prefill) {
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(prefill)}`;
  }

  function serviceWhatsApp(serviceName) {
    const name = userInfo.name || "Client";
    const prefill = `Hello Infinite Cyberspace Hub,\n\nI am interested in: ${serviceName}\n\nName: ${name}\n\nPlease share more details and next steps. Thank you.`;
    return waLink(prefill);
  }

  // ====================== ALL SERVICES MENU ======================
  function showAllServices() {
    trackTopic("services-list");
    const services = knowledge?.services || [];

    let html = `<strong>All Tech Services — Infinite Cyberspace Hub</strong><br><br>
                Select any service below. I will connect you instantly via WhatsApp with our team.<br><br>`;

    services.forEach(s => {
      html += `<div class="ich-service-card" onclick="window.__ichSelectService('${s.name}')">
                 <strong>${s.name}</strong>
                 <span>${s.short || ""}</span>
               </div>`;
    });

    html += `<br>Or continue chatting here for recommendations.`;

    return {
      text: html,
      quick: [
        { label: "Recommend best package", value: "Recommend the best package" },
        { label: "Free consultation", value: "I want a free consultation" },
        { label: "Talk to human now", value: "I want to speak to someone" }
      ]
    };
  }

  // Expose for onclick
  window.__ichSelectService = function (serviceName) {
    document.getElementById("ich-input").value = `I want ${serviceName}`;
    handleSend();
  };

  // ====================== BOOK CONSULTATION ======================
  function bookConsultation() {
    trackTopic("consultation");
    const name = userInfo.name || "Client";
    const companyPart = userInfo.company ? ` from ${userInfo.company}` : "";
    const needPart = userInfo.need ? ` regarding ${userInfo.need}` : "";

    const prefill = `Hello Infinite Cyberspace Hub,\n\nI would like to book a free cybersecurity consultation.\n\nName: ${name}${companyPart}\nInterest: ${needPart || "General consultation"}\n\nPlease share available times. Thank you.`;
    const link = waLink(prefill);

    return {
      text: `<strong>Free Cybersecurity Consultation</strong><br><br>
             20–30 minute no-obligation discussion with our team.<br><br>
             We will review your risks, give practical recommendations, and confirm the best next step.<br><br>
             <a href="${link}" target="_blank" class="ich-wa-link">→ Book Free Consultation on WhatsApp</a>`,
      quick: [
        { label: "Open WhatsApp now", value: "Connect me on WhatsApp" },
        { label: "Show all services", value: "Show all services" },
        { label: "Show packages", value: "Show packages" }
      ]
    };
  }

  // ====================== START CONVERSATION ======================
  function startConversation() {
    if (userInfo.name) {
      botReply(`Welcome back, <strong>${userInfo.name}</strong>.<br><br>
        I am <strong>Asha</strong> — your dedicated Cybersecurity & Digital Resilience specialist at Infinite Cyberspace Hub.<br><br>
        How can I support you today?`, [
        { label: "All Tech Services", value: "Show all services" },
        { label: "Protection packages", value: "Show me protection packages" },
        { label: "IT Support", value: "I need IT support" },
        { label: "Free consultation", value: "I want a free consultation" },
        { label: "Speak to human", value: "I want to speak to someone" }
      ]);
    } else {
      botReply(`Hello. Welcome to <strong>Infinite Cyberspace Hub</strong>.<br><br>
        I am <strong>Asha</strong> — Cybersecurity & IT specialist based in Kisumu.<br><br>
        We deliver enterprise-grade protection, 24/7 monitoring, Zero-Trust, penetration testing and reliable IT support for Kenyan businesses.<br><br>
        May I know your name so I can assist you more precisely?`);
    }
  }

  // ====================== MAIN PROCESS MESSAGE ======================
  function processMessage(text) {
    const lower = text.toLowerCase().trim();
    const namePart = userInfo.name ? `, ${userInfo.name}` : "";

    // Name capture
    if (!userInfo.name) {
      const nameMatch = text.match(/(?:my name is|i am|i'm|this is|call me)\s+([A-Za-z]+)/i) ||
                        (text.split(/\s+/).length <= 2 && /^[A-Za-z]{2,18}$/.test(text.trim()) ? [null, text.trim()] : null);

      if (nameMatch && nameMatch[1]) {
        userInfo.name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
        saveUserInfo();
        trackTopic("onboarding");

        return {
          text: `Thank you, <strong>${userInfo.name}</strong>. Pleasure to meet you.<br><br>
                 What brings you here today?`,
          quick: [
            { label: "All Tech Services", value: "Show all services" },
            { label: "Cybersecurity help", value: "I need cybersecurity help" },
            { label: "IT Support", value: "I need IT support" },
            { label: "Packages & pricing", value: "Show packages" },
            { label: "Free consultation", value: "I want a free consultation" }
          ]
        };
      }
      return { text: `Could you please share your first name so I can address you properly?` };
    }

    // Show all services
    if (/(show all services|all tech services|list services|services list|what services|all services)/i.test(lower)) {
      return showAllServices();
    }

    // Specific service selection → WhatsApp
    const services = knowledge?.services || [];
    for (const s of services) {
      if (lower.includes(s.name.toLowerCase()) || lower.includes(s.id) ||
          (s.id === "soc" && /(soc|24\/7|monitoring)/i.test(lower)) ||
          (s.id === "zerotrust" && /(zero.?trust|firewall)/i.test(lower)) ||
          (s.id === "endpoint" && /(endpoint|edr|xdr|cloud protection)/i.test(lower)) ||
          (s.id === "pentest" && /(penetration|pentest|red team)/i.test(lower)) ||
          (s.id === "awareness" && /(awareness|phishing|training)/i.test(lower)) ||
          (s.id === "it" && /(managed it|it support)/i.test(lower))) {

        trackTopic(s.id);
        userInfo.need = s.name;
        saveUserInfo();

        const link = serviceWhatsApp(s.name);
        return {
          text: `<strong>${s.name}</strong><br><br>
                 ${s.short || ""}<br><br>
                 I will connect you directly with our specialist team on WhatsApp.<br><br>
                 <a href="${link}" target="_blank" class="ich-wa-link">→ Continue on WhatsApp for ${s.name}</a>`,
          quick: [
            { label: "Open WhatsApp now", value: "Connect me on WhatsApp" },
            { label: "See other services", value: "Show all services" },
            { label: "Free consultation", value: "I want a free consultation" }
          ]
        };
      }
    }

    // Thanks
    if (/(thank|thanks|asante|thx|appreciate)/i.test(lower)) {
      trackTopic("thanks");
      setTimeout(() => showRating(), 1600);
      return {
        text: `You are most welcome${namePart}. I remain available whenever you need expert guidance.`
      };
    }

    // Free Consultation
    if (/(consultation|consult|book|schedule|free assessment|talk to expert|free call|book a call)/i.test(lower)) {
      return bookConsultation();
    }

    // Human / WhatsApp
    if (/(human|person|agent|whatsapp|call|speak to|talk to someone|connect me)/i.test(lower)) {
      trackTopic("human");
      const link = waLink(`Hello Asha referred me - ${userInfo.name || "Client"}`);
      return {
        text: `Of course${namePart}. Reach our team directly:<br><br>
               <a href="${link}" target="_blank" class="ich-wa-link">→ Open WhatsApp (+254 768 741 052)</a><br><br>
               Critical incidents receive priority response.`,
        quick: [
          { label: "Open WhatsApp", value: "Connect me on WhatsApp" },
          { label: "Free consultation", value: "I want a free consultation" }
        ]
      };
    }

    // Urgent / Incident
    if (/(hack|breach|ransomware|attack|compromised|urgent|emergency|incident|locked out|encrypted)/i.test(lower)) {
      trackTopic("incident");
      const link = waLink(`URGENT INCIDENT - ${userInfo.name || "Client"}`);
      return {
        text: `<strong>This sounds time-sensitive${namePart}.</strong><br><br>
               For active incidents please contact us immediately so our team can begin triage.<br><br>
               <a href="${link}" target="_blank" class="ich-wa-link" style="color:#f87171">→ Report Urgent Incident on WhatsApp</a><br><br>
               While waiting: avoid paying any ransom and isolate affected systems if possible.`,
        quick: [{ label: "Report on WhatsApp now", value: "Connect me on WhatsApp" }]
      };
    }

    // Packages / Pricing
    if (/(package|pricing|price|plan|cost|how much|kes|fee)/i.test(lower)) {
      trackTopic("packages");
      if (!userInfo.need) {
        return {
          text: `I can recommend the most suitable package. First tell me a bit more:<br><br>
                 1. Main goal or pain point<br>
                 2. Approximate number of users / devices<br>
                 3. Current tools (Microsoft 365, antivirus, etc.)`,
          quick: [
            { label: "Small team (under 15)", value: "We are a small team under 15 people" },
            { label: "Growing company (15-50)", value: "We have 15 to 50 users" },
            { label: "Larger organisation", value: "We have more than 50 users" },
            { label: "Free consultation", value: "I want a free consultation" }
          ]
        };
      }
      return recommendPackage();
    }

    // Cybersecurity intent
    if (/(cyber|security|protect|soc|firewall|endpoint|xdr|edr|zero.?trust|phishing|malware|ransomware|penetration|pentest|awareness|training|assessment)/i.test(lower)) {
      userInfo.need = userInfo.need || "Cybersecurity";
      saveUserInfo();
      trackTopic("cybersecurity");

      return {
        text: `Understood${namePart}. You want to strengthen your cybersecurity posture.<br><br>
               Would you like me to show the full list of our tech services, recommend a package, or connect you for a free consultation?`,
        quick: [
          { label: "All Tech Services", value: "Show all services" },
          { label: "Recommend package", value: "Recommend the best package" },
          { label: "Free consultation", value: "I want a free consultation" },
          { label: "WhatsApp specialist", value: "Connect me on WhatsApp" }
        ]
      };
    }

    // IT Support intent
    if (/(it support|technical|computer|laptop|printer|wifi|network|email|slow|not working|server|backup|microsoft|office 365)/i.test(lower)) {
      userInfo.need = "IT Support";
      saveUserInfo();
      trackTopic("it-support");

      const link = serviceWhatsApp("Managed IT Support");
      return {
        text: `I understand you need reliable IT support${namePart}.<br><br>
               We offer remote + on-site support across Kisumu and surrounding areas covering networks, Microsoft 365, hardware, backups and proactive monitoring.<br><br>
               <a href="${link}" target="_blank" class="ich-wa-link">→ Connect with IT Support on WhatsApp</a>`,
        quick: [
          { label: "Open WhatsApp now", value: "Connect me on WhatsApp" },
          { label: "Managed support packages", value: "Show packages" },
          { label: "Free consultation", value: "I want a free consultation" }
        ]
      };
    }

    // Digital Innovation
    if (/(innovation|digital|transformation|ai|automation|cloud|moderni[sz]e|future|tech strategy)/i.test(lower)) {
      trackTopic("innovation");
      return {
        text: `Digital innovation is only sustainable when security is built in from day one.<br><br>
               We help organisations modernise safely — secure cloud migration, modern workplace tools, and practical AI readiness with Zero-Trust principles.<br><br>
               What area interests you most?`,
        quick: [
          { label: "Secure cloud migration", value: "Secure cloud migration advice" },
          { label: "AI readiness", value: "AI readiness for our business" },
          { label: "All Tech Services", value: "Show all services" },
          { label: "Free consultation", value: "I want a free consultation" }
        ]
      };
    }

    // Collect size
    if (userInfo.need && !userInfo.size) {
      userInfo.size = text;
      saveUserInfo();
      trackTopic("sizing");
      return recommendPackage();
    }

    // Greeting
    if (/(hello|hi|hey|good morning|good afternoon|habari)/i.test(lower)) {
      trackTopic("greeting");
      return {
        text: `Hello${namePart}. How can I assist you with cybersecurity, IT support or digital resilience today?`,
        quick: [
          { label: "All Tech Services", value: "Show all services" },
          { label: "Cybersecurity", value: "I need cybersecurity help" },
          { label: "IT Support", value: "I need IT support" },
          { label: "Packages", value: "Show packages" },
          { label: "Free consultation", value: "I want a free consultation" }
        ]
      };
    }

    // Default fallback
    trackTopic("general");
    return {
      text: `I am listening carefully${namePart}. To give you the most useful guidance, share a bit more detail or choose an option below.`,
      quick: [
        { label: "All Tech Services", value: "Show all services" },
        { label: "Cybersecurity protection", value: "I need cybersecurity protection" },
        { label: "IT Support", value: "I need IT support" },
        { label: "Packages & pricing", value: "Show packages" },
        { label: "Talk to human", value: "I want to speak to someone" }
      ]
    };
  }

  // ====================== SMART PACKAGE RECOMMENDATION ======================
  function recommendPackage() {
    trackTopic("recommendation");
    const context = ((userInfo.need || "") + " " + (userInfo.size || "")).toLowerCase();
    const namePart = userInfo.name ? userInfo.name + ", " : "";

    let recommendation = "";
    let reason = "";
    let nextSteps = "";

    if (/(small|few|1-15|under 15|startup|personal|home|solo)/i.test(context)) {
      recommendation = "Basic Protection — KES 12,900 / month";
      reason = `For a smaller environment, Basic delivers solid foundational controls: next-generation firewall, endpoint protection, email security and monthly reporting — without unnecessary cost.`;
      nextSteps = `Would you like a detailed feature breakdown or guidance on starting with Lipa na M-Pesa?`;
    } else if (/(medium|15-60|20|30|40|50|growing|office|team)/i.test(context) || /(24\/7|monitor|soc|response|xdr)/i.test(context)) {
      recommendation = "Standard Protection — KES 25,900 / month (Most Popular)";
      reason = `Standard is the best balance for most growing Kenyan businesses. It includes everything in Basic plus full 24/7 SOC monitoring, advanced XDR, cloud protection and critical response under 15 minutes.`;
      nextSteps = `I can walk you through the exact inclusions or help you book a free consultation.`;
    } else {
      recommendation = "Premium Protection — KES 38,900 / month";
      reason = `Premium provides the full enterprise-grade stack: continuous monitoring, penetration testing, dedicated support, incident response retainer and advanced awareness training.`;
      nextSteps = `Shall I outline the full scope or schedule a technical consultation?`;
    }

    return {
      text: `${namePart}after reviewing the information you shared, I recommend the <strong>${recommendation}</strong>.<br><br>
             <strong>Why this package?</strong><br>
             ${reason}<br><br>
             ${nextSteps}`,
      quick: [
        { label: "Explain features in detail", value: "Explain the features of this package" },
        { label: "Free consultation", value: "I want a free consultation" },
        { label: "Start with M-Pesa", value: "How do I pay with M-Pesa?" },
        { label: "Talk to human", value: "I want to speak to someone" }
      ]
    };
  }

  // ====================== RATING ======================
  function showRating() {
    if (hasRated || conversationEnded) return;
    conversationEnded = true;

    const durationMin = Math.round((Date.now() - conversationMetrics.startedAt) / 60000);
    const topics = Array.from(conversationMetrics.topics).join(", ") || "general";

    const box = document.getElementById("ich-messages");
    const div = document.createElement("div");
    div.className = "ich-bubble bot";
    div.innerHTML = `
      <div class="ich-rating-box">
        <div style="font-weight:600; margin-bottom:4px;">Was this conversation helpful?</div>
        <div style="font-size:13px; color:#a1a1aa; margin-bottom:8px;">
          Your feedback helps us serve Kenyan businesses better
        </div>
        <div class="ich-stars" id="ich-stars">
          <span data-value="1">★</span>
          <span data-value="2">★</span>
          <span data-value="3">★</span>
          <span data-value="4">★</span>
          <span data-value="5">★</span>
        </div>
        <div id="ich-rating-thanks" style="display:none; color:#22d3ee; margin-top:8px;">
          Thank you. I remain available whenever you need expert guidance.
        </div>
      </div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;

    const stars = div.querySelectorAll("#ich-stars span");
    stars.forEach(star => {
      star.addEventListener("click", () => {
        const value = star.getAttribute("data-value");
        stars.forEach(s => {
          s.classList.toggle("active", s.getAttribute("data-value") <= value);
        });
        localStorage.setItem("ich_has_rated", "true");
        localStorage.setItem("ich_rating_value", value);
        localStorage.setItem("ich_last_topics", topics);
        localStorage.setItem("ich_last_duration", durationMin);
        hasRated = true;
        document.getElementById("ich-rating-thanks").style.display = "block";
      });
    });
  }

  // ====================== HANDLE SEND ======================
  async function handleSend() {
    const input = document.getElementById("ich-input");
    const text = input.value.trim();
    if (!text || isTyping) return;

    addUserBubble(text);
    input.value = "";
    messages.push({ role: "user", content: text });

    showTyping();
    await new Promise(r => setTimeout(r, 500 + Math.random() * 400));

    try {
      if (CONFIG.enableRealAI) {
        // Future AI upgrade path
        const response = await fetch(CONFIG.apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, userInfo })
        });
        if (!response.ok) throw new Error("AI request failed");
        const data = await response.json();
        botReply(data.reply || "I could not generate a response right now.");
        messages.push({ role: "assistant", content: data.reply });
      } else {
        const result = processMessage(text);
        if (typeof result === "string") {
          botReply(result);
        } else {
          botReply(result.text, result.quick || []);
        }
        messages.push({ role: "assistant", content: typeof result === "string" ? result : result.text });
      }
    } catch (err) {
      console.error(err);
      try {
        const result = processMessage(text);
        if (typeof result === "string") {
          botReply(result);
        } else {
          botReply(result.text, result.quick || []);
        }
      } catch (e2) {
        botReply(`I’m having trouble connecting right now. Please try again or WhatsApp us on +254 768 741 052.`);
      }
    }
  }

  // ====================== INIT ======================
  async function init() {
    injectStyles();
    await loadKnowledge();
    createWidget();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();