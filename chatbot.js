(function () {
  "use strict";

  // ====================== CONFIG ======================
  const CONFIG = {
    whatsapp: "254768741052",
    company: "Infinite Cyberspace Hub",
    aiName: "Asha",
    apiEndpoint: "/api/chat",
    enableRealAI: false,          // keep false for static hosting
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
        services: [],
        packages: []
      };
    }
  }

  // ====================== STYLES (kept mostly the same) ======================
  function injectStyles() {
    if (document.getElementById("ich-styles")) return;
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

      .ich-rating-box {
        background: #18181b; border: 1px solid #27272a;
        border-radius: 16px; padding: 16px; margin-top: 8px; text-align: center;
      }
      .ich-stars {
        display: flex; justify-content: center; gap: 8px;
        margin: 12px 0; font-size: 28px; cursor: pointer;
      }
      .ich-stars span { color: #3f3f46; transition: color 0.2s; }
      .ich-stars span.active, .ich-stars span:hover { color: #fbbf24; }
    `;
    const style = document.createElement("style");
    style.id = "ich-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ====================== WIDGET ======================
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
          <h3>Asha • Cybersecurity Specialist</h3>
          <p>Infinite Cyberspace Hub | Kisumu</p>
        </div>
        <button onclick="document.getElementById('ich-window').style.display='none'; document.getElementById('ich-launcher').classList.remove('open')"
                style="background:transparent;border:none;color:white;font-size:22px;cursor:pointer">×</button>
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

    setTimeout(() => startConversation(), 600);
  }

  function toggle() {
    const win = document.getElementById("ich-window");
    const btn = document.getElementById("ich-launcher");
    isOpen = !isOpen;
    win.style.display = isOpen ? "flex" : "none";
    btn.classList.toggle("open", isOpen);
    if (isOpen) document.getElementById("ich-input").focus();
  }

  // ====================== HELPERS ======================
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

  function showRating() {
    if (hasRated || conversationEnded) return;
    conversationEnded = true;

    const box = document.getElementById("ich-messages");
    const div = document.createElement("div");
    div.className = "ich-bubble bot";
    div.innerHTML = `
      <div class="ich-rating-box">
        <div style="font-weight:600; margin-bottom:4px;">Was this conversation helpful?</div>
        <div style="font-size:13px; color:#a1a1aa; margin-bottom:8px;">Your feedback helps me improve</div>
        <div class="ich-stars" id="ich-stars">
          <span data-value="1">★</span><span data-value="2">★</span>
          <span data-value="3">★</span><span data-value="4">★</span>
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
        stars.forEach(s => s.classList.toggle("active", s.getAttribute("data-value") <= value));
        localStorage.setItem("ich_has_rated", "true");
        hasRated = true;
        document.getElementById("ich-rating-thanks").style.display = "block";
      });
    });
  }

  // ====================== START ======================
  function startConversation() {
    if (userInfo.name) {
      botReply(`Welcome back, <strong>${userInfo.name}</strong>.<br><br>
        I am Asha, your cybersecurity and digital resilience specialist at Infinite Cyberspace Hub.<br><br>
        How can I support you today?`, [
        { label: "Cybersecurity assessment", value: "I need a cybersecurity assessment" },
        { label: "IT Support issue", value: "I have an IT support issue" },
        { label: "Protection packages", value: "Show me protection packages" },
        { label: "Digital innovation", value: "I want to discuss digital innovation" },
        { label: "Speak to a human", value: "I want to speak to someone" }
      ]);
    } else {
      botReply(`Hello. Welcome to <strong>Infinite Cyberspace Hub</strong>.<br><br>
        I am <strong>Asha</strong> — your dedicated Cybersecurity & IT specialist based in Kisumu.<br><br>
        I help Kenyan businesses build practical, enterprise-grade protection and digital resilience.<br><br>
        May I know your name so I can assist you more precisely?`);
    }
  }

  // ====================== CORE EXPERT LOGIC ======================
  function processMessage(text) {
    const lower = text.toLowerCase().trim();
    const namePart = userInfo.name ? `, ${userInfo.name}` : "";

    // ---- Name capture ----
    if (!userInfo.name) {
      const nameMatch = text.match(/(?:my name is|i am|i'm|this is|call me)\s+([A-Za-z]+)/i) ||
                        (text.split(" ").length <= 3 && /^[A-Za-z]+$/.test(text.trim()) ? [null, text.trim()] : null);
      if (nameMatch && nameMatch[1] && nameMatch[1].length > 1 && nameMatch[1].length < 20) {
        userInfo.name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
        saveUserInfo();
        return {
          text: `Thank you, <strong>${userInfo.name}</strong>. It is a pleasure to meet you.<br><br>
                 To give you accurate guidance, could you briefly tell me what brought you here today?<br>
                 (e.g. ransomware concerns, IT downtime, need for 24/7 monitoring, digital transformation, or general protection)`,
          quick: [
            { label: "Cybersecurity help", value: "I need cybersecurity help" },
            { label: "IT Support", value: "I need IT support" },
            { label: "Packages & pricing", value: "Show packages" },
            { label: "Digital innovation", value: "Digital innovation advice" }
          ]
        };
      }
      return { text: `Could you please share your first name so I can address you properly?` };
    }

    // ---- Thanks ----
    if (/(thank|thanks|asante|thx|appreciate)/i.test(lower)) {
      setTimeout(() => showRating(), 1600);
      return {
        text: `You are most welcome${namePart}. I am always available when you need expert cybersecurity or IT guidance.`
      };
    }

    // ---- Human / WhatsApp ----
    if (/(human|person|agent|whatsapp|call|speak to|talk to someone)/i.test(lower)) {
      return {
        text: `Of course${namePart}. You can reach our team directly:<br><br>
               <a href="https://wa.me/${CONFIG.whatsapp}?text=Hello%20Asha%20referred%20me%20-%20${encodeURIComponent(userInfo.name || '')}" 
                  target="_blank" style="color:#22d3ee;font-weight:600">→ Open WhatsApp (+254 768 741 052)</a><br><br>
               Critical incidents receive priority response. I remain available here if you need further clarification.`,
        quick: [{ label: "Open WhatsApp", value: "Connect me on WhatsApp" }]
      };
    }

    // ---- Urgent / Incident ----
    if (/(hack|breach|ransomware|attack|compromised|urgent|emergency|incident|locked out|encrypted)/i.test(lower)) {
      return {
        text: `<strong>This sounds time-sensitive${namePart}.</strong><br><br>
               For active incidents (ransomware, suspected breach, or system lockout), please contact us immediately on WhatsApp so our team can begin triage.<br><br>
               <a href="https://wa.me/${CONFIG.whatsapp}?text=URGENT%20INCIDENT%20-%20${encodeURIComponent(userInfo.name || 'Client')}" 
                  target="_blank" style="color:#f87171;font-weight:600">→ Report Urgent Incident on WhatsApp</a><br><br>
               While waiting, avoid paying any ransom and disconnect affected systems from the network if possible.`,
        quick: [{ label: "Report on WhatsApp now", value: "Connect me on WhatsApp" }]
      };
    }

    // ---- Packages / Pricing ----
    if (/(package|pricing|price|plan|cost|how much|kes|fee)/i.test(lower)) {
      if (!userInfo.need) {
        return {
          text: `I can recommend the most suitable package, but first I need a clearer picture of your environment so I do not oversell or undersell you.<br><br>
                 Please share:<br>
                 1. Main goal or current pain point<br>
                 2. Approximate number of users / devices<br>
                 3. Whether you already use Microsoft 365, Google Workspace, or any antivirus`,
          quick: [
            { label: "Small team (under 15)", value: "We are a small team under 15 people" },
            { label: "Growing company (15-50)", value: "We have 15 to 50 users" },
            { label: "Larger organisation", value: "We have more than 50 users" }
          ]
        };
      }
      return recommendPackage();
    }

    // ---- Cybersecurity intent ----
    if (/(cyber|security|protect|soc|firewall|endpoint|xdr|edr|zero.?trust|phishing|malware|ransomware|penetration|pentest|awareness|training)/i.test(lower)) {
      userInfo.need = userInfo.need || "Cybersecurity";
      saveUserInfo();

      if (/(phishing|awareness|training|employee)/i.test(lower)) {
        return {
          text: `Employee awareness is one of the highest-ROI controls for Kenyan organisations.<br><br>
                 We run practical phishing simulations combined with short, relevant training modules tailored to local threats (mobile money scams, business email compromise, etc.).<br><br>
                 Would you like me to outline a typical 90-day awareness programme, or shall we discuss full protection packages that include training?`,
          quick: [
            { label: "90-day awareness plan", value: "Explain the 90-day awareness programme" },
            { label: "Full protection packages", value: "Show protection packages" },
            { label: "Book consultation", value: "I want a free consultation" }
          ]
        };
      }

      if (/(zero.?trust|firewall|network)/i.test(lower)) {
        return {
          text: `Zero-Trust is no longer optional for organisations handling sensitive data or remote staff.<br><br>
                 We design practical Zero-Trust architectures that start with identity, device health, and network segmentation — without forcing a complete rip-and-replace.<br><br>
                 Would you like a high-level overview of how we typically implement this for Kenyan SMEs, or a full package recommendation?`,
          quick: [
            { label: "Zero-Trust overview", value: "Explain Zero-Trust approach" },
            { label: "Recommend package", value: "Recommend the best package" }
          ]
        };
      }

      return {
        text: `Understood${namePart}. You are looking at strengthening your cybersecurity posture.<br><br>
               To give precise advice I need a bit more context:<br>
               • Roughly how many users or endpoints?<br>
               • Any current security tools (antivirus, Microsoft 365, firewall)?<br>
               • Main concern right now (ransomware, email threats, compliance, remote access)?`,
        quick: [
          { label: "Under 20 users", value: "We have under 20 users" },
          { label: "20-60 users", value: "We have 20 to 60 users" },
          { label: "More than 60", value: "We have more than 60 users" },
          { label: "Recommend package now", value: "Recommend the best package" }
        ]
      };
    }

    // ---- IT Support intent ----
    if (/(it support|technical|computer|laptop|printer|wifi|network|email|slow|not working|server|backup|microsoft|office 365)/i.test(lower)) {
      userInfo.need = "IT Support";
      saveUserInfo();
      return {
        text: `I understand you need reliable IT support${namePart}.<br><br>
               We provide both remote and on-site support across Kisumu and surrounding areas, covering:<br>
               • Network & Wi-Fi issues<br>
               • Microsoft 365 / Google Workspace<br>
               • Hardware troubleshooting<br>
               • Backup & recovery<br>
               • Proactive monitoring<br><br>
               Would you like me to connect you with a technician, or shall we discuss a managed support package?`,
        quick: [
          { label: "Speak to technician", value: "I want to speak to a technician" },
          { label: "Managed support packages", value: "Show IT support packages" },
          { label: "WhatsApp support", value: "Connect me on WhatsApp" }
        ]
      };
    }

    // ---- Digital Innovation / Transformation ----
    if (/(innovation|digital|transformation|ai|automation|cloud|moderni[sz]e|future|tech strategy)/i.test(lower)) {
      return {
        text: `Digital innovation is only sustainable when security and reliability are built in from the start.<br><br>
               We help Kenyan organisations modernise safely — cloud migration, secure collaboration platforms, basic automation, and practical AI readiness — always with Zero-Trust principles and local support.<br><br>
               What area are you most interested in exploring right now?`,
        quick: [
          { label: "Secure cloud migration", value: "Secure cloud migration advice" },
          { label: "AI readiness", value: "AI readiness for our business" },
          { label: "Modern workplace", value: "Modern secure workplace tools" },
          { label: "Full consultation", value: "I want a free consultation" }
        ]
      };
    }

    // ---- Collect size if missing ----
    if (userInfo.need && !userInfo.size) {
      userInfo.size = text;
      saveUserInfo();
      return recommendPackage();
    }

    // ---- Greeting ----
    if (/(hello|hi|hey|good morning|good afternoon|habari)/i.test(lower)) {
      return {
        text: `Hello${namePart}. How can I assist you with cybersecurity, IT support, or digital resilience today?`,
        quick: [
          { label: "Cybersecurity", value: "I need cybersecurity help" },
          { label: "IT Support", value: "I need IT support" },
          { label: "Packages", value: "Show packages" }
        ]
      };
    }

    // ---- Default expert fallback ----
    return {
      text: `I am listening carefully${namePart}. To give you the most useful guidance, could you share a bit more detail?<br><br>
             For example:<br>
             • The specific problem or goal<br>
             • Number of users / devices<br>
             • Whether this is about protection, support, or digital transformation`,
      quick: [
        { label: "Cybersecurity protection", value: "I need cybersecurity protection" },
        { label: "IT Support", value: "I need IT support" },
        { label: "Packages & pricing", value: "Show packages" },
        { label: "Talk to human", value: "I want to speak to someone" }
      ]
    };
  }

  // ====================== SMART PACKAGE RECOMMENDATION ======================
  function recommendPackage() {
    const context = ((userInfo.need || "") + " " + (userInfo.size || "")).toLowerCase();
    const namePart = userInfo.name ? userInfo.name + ", " : "";

    let recommendation = "";
    let reason = "";
    let nextSteps = "";

    if (/(small|few|1-15|under 15|startup|personal|home|solo)/i.test(context)) {
      recommendation = "Basic Protection — KES 12,900 / month";
      reason = `For a smaller environment, Basic already delivers solid foundational controls: next-generation firewall, endpoint protection, malware & ransomware shields, email security, and monthly reporting. It avoids unnecessary cost while closing the most common attack paths.`;
      nextSteps = `Would you like a detailed feature breakdown, or shall I guide you on how to start with Lipa na M-Pesa?`;
    } else if (/(medium|15-60|20|30|40|50|growing|office|team)/i.test(context) || /(24\/7|monitor|soc|response|xdr)/i.test(context)) {
      recommendation = "Standard Protection — KES 25,900 / month (Most Popular)";
      reason = `Based on what you described, Standard is the best balance for most growing Kenyan businesses. It includes everything in Basic plus full 24/7 SOC monitoring, advanced XDR, cloud protection, and critical response under 15 minutes. This is the package most organisations choose when they want continuous visibility and fast reaction.`;
      nextSteps = `I can walk you through the exact inclusions or help you book a free consultation to confirm fit.`;
    } else {
      recommendation = "Premium Protection — KES 38,900 / month";
      reason = `Given the scale and needs indicated, Premium provides the full enterprise-grade stack: continuous monitoring, penetration testing, dedicated support, incident response retainer, and employee security awareness. It is designed for organisations that require higher assurance and proactive testing.`;
      nextSteps = `Shall I outline the full scope, or would you prefer to schedule a technical consultation?`;
    }

    return {
      text: `${namePart}after reviewing the information you shared, I recommend the <strong>${recommendation}</strong>.<br><br>
             <strong>Why this package?</strong><br>
             ${reason}<br><br>
             ${nextSteps}`,
      quick: [
        { label: "Explain features in detail", value: "Explain the features of this package" },
        { label: "Book free consultation", value: "I want a free consultation" },
        { label: "Start with M-Pesa", value: "How do I pay with M-Pesa?" },
        { label: "Talk to human", value: "I want to speak to someone" }
      ]
    };
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
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    try {
      if (CONFIG.enableRealAI) {
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
      // Final safety net
      const result = processMessage(text);
      if (typeof result === "string") {
        botReply(result);
      } else {
        botReply(result.text, result.quick || []);
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