(function () {
  "use strict";

  // ====================== CONFIG ======================
  const CONFIG = {
    whatsapp: "254768741052",
    company: "Infinite Cyberspace Hub",
    aiName: "Asha",
    apiEndpoint: "/api/chat",
    enableRealAI: false               // set to true when you have a real AI backend
  };

  // ====================== STATE ======================
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
    currentTools: null
  };

  const savedInfo = localStorage.getItem("ich_user_info");
  if (savedInfo) {
    try { userInfo = JSON.parse(savedInfo); } catch(e) {}
  }

  // ====================== STYLES ======================
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

  // ====================== CREATE WIDGET ======================
  function createWidget() {
    if (document.getElementById("ich-launcher")) return;

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
          <p>Always here for you • Cybersecurity & IT Support</p>
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

    setTimeout(() => startConversation(), 700);
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

  // ====================== RATING (only when conversation ends & client is satisfied) ======================
  function showRating() {
    if (hasRated || conversationEnded) return;
    conversationEnded = true;

    const box = document.getElementById("ich-messages");
    const div = document.createElement("div");
    div.className = "ich-bubble bot";
    div.innerHTML = `
      <div class="ich-rating-box">
        <div style="font-weight:600; margin-bottom:4px;">Was this conversation helpful?</div>
        <div style="font-size:13px; color:#a1a1aa; margin-bottom:8px;">Your feedback helps me serve you better next time</div>
        <div class="ich-stars" id="ich-stars">
          <span data-value="1">★</span>
          <span data-value="2">★</span>
          <span data-value="3">★</span>
          <span data-value="4">★</span>
          <span data-value="5">★</span>
        </div>
        <div id="ich-rating-thanks" style="display:none; color:#22d3ee; margin-top:8px;">
          Thank you so much! I am always here for you.
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
        hasRated = true;
        document.getElementById("ich-rating-thanks").style.display = "block";
      });
    });
  }

  // ====================== SAVE USER INFO ======================
  function saveUserInfo() {
    localStorage.setItem("ich_user_info", JSON.stringify(userInfo));
  }

  // ====================== START CONVERSATION ======================
  function startConversation() {
    if (userInfo.name) {
      botReply(`Welcome back, <strong>${userInfo.name}</strong>.<br><br>
      I am still here and ready to help you with cybersecurity or IT support.<br><br>
      How can I assist you today?`, [
        { label: "IT Support", value: "I need IT support" },
        { label: "Cybersecurity help", value: "I need cybersecurity help" },
        { label: "View packages", value: "I want to know about packages" },
        { label: "Talk to a human", value: "I want to speak to someone" }
      ]);
    } else {
      botReply(`Hello! Welcome to Infinite Cyberspace Hub.<br><br>
      I am <strong>Asha</strong>, your dedicated cybersecurity and IT support specialist.<br>
      I have been here from the beginning and I will always remain available for you.<br><br>
      May I know your name so I can assist you better?`);
    }
  }

  // ====================== MAIN LOGIC ======================
  function processMessage(text) {
    const lower = text.toLowerCase().trim();

    // 1. Detect name
    const nameMatch = text.match(/(?:my name is|i am|i'm|this is)\s+([A-Za-z]+)/i);
    if (nameMatch && !userInfo.name) {
      userInfo.name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
      saveUserInfo();
      return `Thank you, ${userInfo.name}. It is a pleasure to meet you.<br><br>
      Please tell me what challenge or need brought you here today. I will listen carefully before recommending anything.`;
    }

    // 2. Thanks handling
    if (/(thank|thanks|asante|thx|ty)/i.test(lower)) {
      const namePart = userInfo.name ? `, ${userInfo.name}` : "";
      setTimeout(() => showRating(), 1800); // only show rating after thanks when conversation feels finished
      return `You are most welcome${namePart}. I am always here whenever you need me.`;
    }

    // 3. Talk to human
    if (/(human|person|agent|whatsapp|call|speak to)/i.test(lower)) {
      return `Of course. You can reach our team instantly on WhatsApp:<br><br>
      <a href="https://wa.me/${CONFIG.whatsapp}" target="_blank" style="color:#22d3ee; text-decoration:underline;">
      +254 768 741 052</a><br><br>
      They respond very quickly. I will still be here if you need me later.`;
    }

    // 4. Package request – force diagnosis first
    if (/(package|pricing|price|plan|cost|how much)/i.test(lower) && !userInfo.need) {
      return `I will gladly recommend the right package, but first I need to understand your situation properly so I do not give you something unnecessary.<br><br>
      Could you please tell me:<br>
      1. What is the main problem or goal you have right now?<br>
      2. Roughly how many employees or devices do you have?`;
    }

    // 5. Collect needs
    if (!userInfo.need) {
      userInfo.need = text;
      saveUserInfo();
      return `Thank you for sharing that${userInfo.name ? ", " + userInfo.name : ""}.<br><br>
      To recommend the most suitable protection, may I also know approximately how many people or devices are involved, and whether you currently use any antivirus, Microsoft 365, or Google Workspace?`;
    }

    // 6. Collect size / tools
    if (userInfo.need && !userInfo.size) {
      userInfo.size = text;
      saveUserInfo();

      // Now recommend based on collected info
      return recommendPackage();
    }

    // 7. Default helpful responses
    if (/(hello|hi|hey|good morning|good afternoon)/i.test(lower)) {
      return `Hello${userInfo.name ? " " + userInfo.name : ""}! How can I help you today?`;
    }

    if (/(support|help|issue|problem|troubleshoot)/i.test(lower)) {
      return `I am ready to help. Please describe the issue in as much detail as you can so I can guide you correctly.`;
    }

    // Fallback
    return `I understand. Please share a bit more about what you need — for example the specific problem, number of users, or whether you are looking for protection packages. I am listening carefully.`;
  }

  // ====================== SMART PACKAGE RECOMMENDATION ======================
  function recommendPackage() {
    const need = (userInfo.need + " " + (userInfo.size || "")).toLowerCase();

    let recommendation = "";
    let reason = "";

    if (/(small|few|1-10|under 10|startup|personal|home)/i.test(need)) {
      recommendation = "Basic Protection (KES 12,900 per month)";
      reason = `Because you mentioned a smaller setup, the Basic package already gives you solid next-generation firewall, endpoint protection, malware & ransomware shields, and monthly reports — without paying for features you may not need yet.`;
    } 
    else if (/(medium|20|30|50|growing|office|team)/i.test(need) || /(24\/7|monitor|soc|response)/i.test(need)) {
      recommendation = "Standard Protection (KES 25,900 per month) — our most popular plan";
      reason = `Based on what you described, Standard is the best fit. It includes everything in Basic plus full 24/7 SOC monitoring, advanced XDR, cloud protection, and critical response under 15 minutes. This matches businesses that need continuous protection and fast reaction.`;
    } 
    else {
      recommendation = "Premium Protection (KES 38,900 per month)";
      reason = `Given the scale and needs you shared, Premium gives you the full enterprise-grade stack: 24/7 monitoring, penetration testing, dedicated support, and employee training. This is designed for organisations that want maximum protection and proactive testing.`;
    }

    const namePart = userInfo.name ? userInfo.name + ", " : "";

    setTimeout(() => {
      // Soft invitation to rate later if they say thanks
    }, 3000);

    return `${namePart}after carefully listening to your needs, I recommend the <strong>${recommendation}</strong>.<br><br>
    <strong>Why this package?</strong><br>
    ${reason}<br><br>
    Would you like me to explain the features in more detail, or shall I guide you on how to get started with Lipa na M-Pesa?`;
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
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    let reply;
    if (CONFIG.enableRealAI) {
      // Future: call your real AI backend here
      reply = "Real AI response will appear here.";
    } else {
      reply = processMessage(text);
    }

    botReply(reply);
  }

  // ====================== INIT ======================
  function init() {
    injectStyles();
    createWidget();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();