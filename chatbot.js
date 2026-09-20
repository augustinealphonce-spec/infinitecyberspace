(function () {
  "use strict";

  // ====================== CONFIG ======================
  const CONFIG = {
    whatsapp: "254768741052",
    company: "Infinite Cyberspace Hub",
    aiName: "Asha",
    apiEndpoint: "/api/chat",
    enableRealAI: false,
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

  // Quality tracking
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
        services: [],
        packages: []
      };
    }
  }

  // ====================== STYLES ======================
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
          0 8px 32px rgba(6, 182, 212, 0.45),
          0 0 0 1px rgba(255,255,255,0.1),
          inset 0 1px 0 rgba(255,255,255,0.2);
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
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), transparent 60%);
        border-radius: 50%;
        pointer-events: none;
      }

      #ich-launcher:hover {
        transform: scale(1.12) translateY(-2px);
        box-shadow: 
          0 14px 40px rgba(6, 182, 212, 0.55),
          0 0 0 1px rgba(255,255,255,0.15),
          inset 0 1px 0 rgba(255,255,255,0.25);
      }

      #ich-launcher.open {
        transform: rotate(90deg) scale(1.05);
        background: linear-gradient(145deg, #ef4444, #f87171);
        box-shadow: 0 8px 32px rgba(239, 68, 68, 0.45);
      }

      #ich-launcher svg {
        width: 30px;
        height: 30px;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
        transition: transform 0.3s ease;
      }

      #ich-launcher:hover svg {
        transform: scale(1.08);
      }

      #ich-window {
        position: fixed;
        bottom: 115px;
        right: 28px;
        z-index: 99998;
        width: 400px;
        max-width: calc(100vw - 24px);
        height: 620px;
        max-height: calc(100vh - 140px);
        background: #09090b;
        border: 1px solid rgba(6, 182, 212, 0.22);
        border-radius: 24px;
        display: none;
        flex-direction: column;
        box-shadow: 
          0 25px 60px rgba(0,0,0,0.7),
          0 0 0 1px rgba(255,255,255,0.03);
        overflow: hidden;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        animation: ichSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      }

      @keyframes ichSlideUp {
        from { opacity: 0; transform: translateY(24px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      #ich-header {
        background: linear-gradient(90deg, #0e7490, #0891b2);
        padding: 18px 20px;
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
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        pointer-events: none;
      }

      #ich-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.2px;
      }

      #ich-header p {
        margin: 3px 0 0;
        font-size: 12px;
        opacity: 0.9;
      }

      #ich-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        scroll-behavior: smooth;
      }

      .ich-bubble {
        max-width: 88%;
        padding: 13px 17px;
        border-radius: 18px;
        font-size: 14.5px;
        line-height: 1.55;
      }

      .ich-bubble.bot {
        background: #18181b;
        color: #e4e4e7;
        border: 1px solid #27272a;
        align-self: flex-start;
        border-bottom-left-radius: 6px;
      }

      .ich-bubble.user {
        background: linear-gradient(135deg, #0891b2, #06b6d4);
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 6px;
        box-shadow: 0 4px 14px rgba(6, 182, 212, 0.25);
      }

      .ich-quick {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .ich-quick button {
        background: rgba(6, 182, 212, 0.1);
        border: 1px solid rgba(6, 182, 212, 0.3);
        color: #22d3ee;
        padding: 7px 14px;
        border-radius: 999px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .ich-quick button:hover {
        background: rgba(6, 182, 212, 0.22);
        transform: translateY(-1px);
        border-color: rgba(6, 182, 212, 0.5);
      }

      .ich-typing {
        display: flex;
        gap: 5px;
        padding: 14px 18px;
        background: #18181b;
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
        padding: 16px;
        border-top: 1px solid #27272a;
        background: #09090b;
        display: flex;
        gap: 10px;
      }

      #ich-input {
        flex: 1;
        background: #18181b;
        border: 1px solid #3f3f46;
        border-radius: 14px;
        padding: 13px 16px;
        color: white;
        font-size: 14.5px;
        outline: none;
        transition: border-color 0.2s;
      }

      #ich-input:focus {
        border-color: #06b6d4;
        box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
      }

      #ich-send {
        width: 48px;
        background: linear-gradient(135deg, #06b6d4, #22d3ee);
        border: none;
        border-radius: 14px;
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
        transform: scale(1.05);
      }

      .ich-rating-box {
        background: #18181b;
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
        transform: scale(1.15);
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
          <p>Infinite Cyberspace Hub · Kisumu</p>
        </div>
        <button onclick="document.getElementById('ich-window').style.display='none'; document.getElementById('ich-launcher').classList.remove('open')"
                style="background:transparent;border:none;color:white;font-size:22px;cursor:pointer;line-height:1;opacity:0.9;transition:opacity 0.2s"
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

  // ====================== QUALITY TRACKING ======================
  function trackTopic(topic) {
    conversationMetrics.topics.add(topic);
    conversationMetrics.messages++;
  }

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
          Your feedback helps me serve Kenyan businesses better
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

        console.log("Conversation quality:", {
          rating: value,
          topics,
          durationMin,
          messages: conversationMetrics.messages,
          name: userInfo.name || "Anonymous"
        });

        document.getElementById("ich-rating-thanks").style.display = "block";
      });
    });
  }

  // ====================== BOOK CONSULTATION ======================
  function bookConsultation() {
    trackTopic("consultation");

    const name = userInfo.name || "Client";
    const companyPart = userInfo.company ? ` from ${userInfo.company}` : "";
    const needPart = userInfo.need ? ` regarding ${userInfo.need}` : "";

    const prefill = `Hello Infinite Cyberspace Hub,%0A%0AI would like to book a free cybersecurity consultation.%0A%0AName: ${encodeURIComponent(name)}${encodeURIComponent(companyPart)}%0AInterest: ${encodeURIComponent(needPart || "General consultation")}%0A%0APlease share available times. Thank you.`;

    const waLink = `https://wa.me/${CONFIG.whatsapp}?text=${prefill}`;

    return {
      text: `<strong>Free Cybersecurity Consultation</strong><br><br>
             I can connect you directly with our team for a no-obligation 20–30 minute discussion.<br><br>
             During the call we will:<br>
             • Review your current risks<br>
             • Give practical recommendations<br>
             • Confirm which (if any) package fits best<br><br>
             <a href="${waLink}" target="_blank" style="color:#22d3ee; font-weight:600; text-decoration:underline;">
             → Book Free Consultation on WhatsApp</a><br><br>
             Or continue chatting here if you prefer more details first.`,
      quick: [
        { label: "Open WhatsApp now", value: "Connect me on WhatsApp" },
        { label: "Tell me more first", value: "Explain more about the consultation" },
        { label: "Show packages", value: "Show packages" }
      ]
    };
  }

  // ====================== START CONVERSATION ======================
  function startConversation() {
    if (userInfo.name) {
      botReply(`Welcome back, <strong>${userInfo.name}</strong>.<br><br>
        I am Asha, your cybersecurity and digital resilience specialist at Infinite Cyberspace Hub.<br><br>
        How can I support you today?`, [
        { label: "Cybersecurity assessment", value: "I need a cybersecurity assessment" },
        { label: "IT Support issue", value: "I have an IT support issue" },
        { label: "Protection packages", value: "Show me protection packages" },
        { label: "Book free consultation", value: "I want a free consultation" },
        { label: "Speak to a human", value: "I want to speak to someone" }
      ]);
    } else {
      botReply(`Hello. Welcome to <strong>Infinite Cyberspace Hub</strong>.<br><br>
        I am <strong>Asha</strong> — your dedicated Cybersecurity & IT specialist based in Kisumu.<br><br>
        I help Kenyan businesses build practical, enterprise-grade protection and digital resilience.<br><br>
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
          text: `Thank you, <strong>${userInfo.name}</strong>. It is a pleasure to meet you.<br><br>
                 To give you accurate guidance, could you briefly tell me what brought you here today?<br>
                 (e.g. ransomware concerns, IT downtime, need for 24/7 monitoring, digital transformation, or general protection)`,
          quick: [
            { label: "Cybersecurity help", value: "I need cybersecurity help" },
            { label: "IT Support", value: "I need IT support" },
            { label: "Packages & pricing", value: "Show packages" },
            { label: "Book free consultation", value: "I want a free consultation" }
          ]
        };
      }
      return { text: `Could you please share your first name so I can address you properly?` };
    }

    // Thanks
    if (/(thank|thanks|asante|thx|appreciate)/i.test(lower)) {
      trackTopic("thanks");
      setTimeout(() => showRating(), 1600);
      return {
        text: `You are most welcome${namePart}. I am always available when you need expert cybersecurity or IT guidance.`
      };
    }

    // Free Consultation
    if (/(consultation|consult|book|schedule|free assessment|talk to expert|free call|book a call)/i.test(lower)) {
      return bookConsultation();
    }

    // Human / WhatsApp
    if (/(human|person|agent|whatsapp|call|speak to|talk to someone|connect me)/i.test(lower)) {
      trackTopic("human");
      return {
        text: `Of course${namePart}. You can reach our team directly:<br><br>
               <a href="https://wa.me/${CONFIG.whatsapp}?text=Hello%20Asha%20referred%20me%20-%20${encodeURIComponent(userInfo.name || '')}" 
                  target="_blank" style="color:#22d3ee;font-weight:600">→ Open WhatsApp (+254 768 741 052)</a><br><br>
               Critical incidents receive priority response. I remain available here if you need further clarification.`,
        quick: [
          { label: "Open WhatsApp", value: "Connect me on WhatsApp" },
          { label: "Book free consultation", value: "I want a free consultation" }
        ]
      };
    }

    // Urgent / Incident
    if (/(hack|breach|ransomware|attack|compromised|urgent|emergency|incident|locked out|encrypted)/i.test(lower)) {
      trackTopic("incident");
      return {
        text: `<strong>This sounds time-sensitive${namePart}.</strong><br><br>
               For active incidents (ransomware, suspected breach, or system lockout), please contact us immediately on WhatsApp so our team can begin triage.<br><br>
               <a href="https://wa.me/${CONFIG.whatsapp}?text=URGENT%20INCIDENT%20-%20${encodeURIComponent(userInfo.name || 'Client')}" 
                  target="_blank" style="color:#f87171;font-weight:600">→ Report Urgent Incident on WhatsApp</a><br><br>
               While waiting: avoid paying any ransom and disconnect affected systems from the network if possible.`,
        quick: [{ label: "Report on WhatsApp now", value: "Connect me on WhatsApp" }]
      };
    }

    // Packages / Pricing
    if (/(package|pricing|price|plan|cost|how much|kes|fee)/i.test(lower)) {
      trackTopic("packages");
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
            { label: "Larger organisation", value: "We have more than 50 users" },
            { label: "Book free consultation", value: "I want a free consultation" }
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

      if (/(phishing|awareness|training|employee)/i.test(lower)) {
        return {
          text: `Employee awareness is one of the highest-ROI controls for Kenyan organisations.<br><br>
                 We run practical phishing simulations combined with short, relevant training modules tailored to local threats (mobile money scams, business email compromise, etc.).<br><br>
                 Would you like me to outline a typical 90-day awareness programme, or shall we discuss full protection packages that include training?`,
          quick: [
            { label: "90-day awareness plan", value: "Explain the 90-day awareness programme" },
            { label: "Full protection packages", value: "Show protection packages" },
            { label: "Book free consultation", value: "I want a free consultation" }
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
            { label: "Recommend package", value: "Recommend the best package" },
            { label: "Book free consultation", value: "I want a free consultation" }
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
          { label: "Recommend package now", value: "Recommend the best package" },
          { label: "Book free consultation", value: "I want a free consultation" }
        ]
      };
    }

    // IT Support intent
    if (/(it support|technical|computer|laptop|printer|wifi|network|email|slow|not working|server|backup|microsoft|office 365)/i.test(lower)) {
      userInfo.need = "IT Support";
      saveUserInfo();
      trackTopic("it-support");

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
          { label: "Book free consultation", value: "I want a free consultation" },
          { label: "WhatsApp support", value: "Connect me on WhatsApp" }
        ]
      };
    }

    // Digital Innovation
    if (/(innovation|digital|transformation|ai|automation|cloud|moderni[sz]e|future|tech strategy)/i.test(lower)) {
      trackTopic("innovation");
      return {
        text: `Digital innovation is only sustainable when security and reliability are built in from the start.<br><br>
               We help Kenyan organisations modernise safely — cloud migration, secure collaboration platforms, basic automation, and practical AI readiness — always with Zero-Trust principles and local support.<br><br>
               What area are you most interested in exploring right now?`,
        quick: [
          { label: "Secure cloud migration", value: "Secure cloud migration advice" },
          { label: "AI readiness", value: "AI readiness for our business" },
          { label: "Modern workplace", value: "Modern secure workplace tools" },
          { label: "Book free consultation", value: "I want a free consultation" }
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
        text: `Hello${namePart}. How can I assist you with cybersecurity, IT support, or digital resilience today?`,
        quick: [
          { label: "Cybersecurity", value: "I need cybersecurity help" },
          { label: "IT Support", value: "I need IT support" },
          { label: "Packages", value: "Show packages" },
          { label: "Book free consultation", value: "I want a free consultation" }
        ]
      };
    }

    // Default fallback
    trackTopic("general");
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
        { label: "Book free consultation", value: "I want a free consultation" },
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
      reason = `For a smaller environment, Basic already delivers solid foundational controls: next-generation firewall, endpoint protection, malware & ransomware shields, email security, and monthly reporting. It avoids unnecessary cost while closing the most common attack paths.`;
      nextSteps = `Would you like a detailed feature breakdown, or shall I guide you on how to start with Lipa na M-Pesa?`;
    } 
    else if (/(medium|15-60|20|30|40|50|growing|office|team)/i.test(context) || /(24\/7|monitor|soc|response|xdr)/i.test(context)) {
      recommendation = "Standard Protection — KES 25,900 / month (Most Popular)";
      reason = `Based on what you described, Standard is the best balance for most growing Kenyan businesses. It includes everything in Basic plus full 24/7 SOC monitoring, advanced XDR, cloud protection, and critical response under 15 minutes. This is the package most organisations choose when they want continuous visibility and fast reaction.`;
      nextSteps = `I can walk you through the exact inclusions or help you book a free consultation to confirm fit.`;
    } 
    else {
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
    await new Promise(r => setTimeout(r, 550 + Math.random() * 450));

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