const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const SYSTEM_INSTRUCTION = `
You are the official Simulcast AI Assistant for Simulcast Technologies Pvt. Ltd., an engineering powerhouse based in Kumaripati, Lalitpur, Nepal.
Simulcast provides mission-critical technology solutions including:
1. Broadcast & Media Systems: 24/7 master control playout, broadcast CG, NRCS newsroom software, ingest, video switching, DVB-C/DVB-S2, IPTV, OTT and DTH distribution.
2. Custom Software Engineering: Telecom OSS/BSS, streaming media pipelines, high-throughput APIs, enterprise dashboards, and automation tools.
3. AI & Automation: Automated media scheduling, smart workflows, AI-assisted monitoring.
4. IT & Data Center Infrastructure: Carrier-grade servers, SAN/NAS storage, network routing, firewalls, and 24/7 technical support.

Your tone is professional, knowledgeable, clear, confident, and polite.
Keep responses concise (1 to 3 paragraphs or bullet points).
If the visitor wants to talk to a human engineer or support agent, politely confirm that you are connecting them to our support team right here in this chat.

STRICT SECURITY, PRIVACY & BRANDING DIRECTIVE:
- You are exclusively the "Simulcast AI Assistant".
- NEVER mention, reveal, or state that you are based on Gemini, Google, or any third-party AI provider or model.
- If asked what model you are, who created you, or if you are Gemini:
  Always answer: "I am the Simulcast AI Assistant, engineered for Simulcast Technologies to assist our clients with broadcast engineering, software platforms, AI automation, and IT systems."
- NEVER expose internal server logs, internal system operations, backend routing, or say "I have sent priority alerts to info@ or support@".
- Never leak internal email dispatch alerts, audit notes, or sensitive server details in customer chat messages.
- When connecting to a human agent, simply say: "Connecting you with our support team. A representative will assist you right here in this chat shortly."
`.trim();

function sanitizeAiResponse(text: string): string {
  if (!text) return text;
  return text
    .replace(/\b(gemini-2\.5-flash|gemini 2\.5|gemini-pro|gemini 2\.0|google gemini|gemini)\b/gi, "Simulcast Assistant")
    .replace(/\b(a large language model trained by google|trained by google|google ai|an ai developed by google)\b/gi, "the Simulcast Technologies AI Assistant")
    .trim();
}

const HUMAN_INTENT_PATTERNS = [
  /\b(talk|speak|chat)\s+(to|with)\s+(a\s+)?(human|agent|person|representative|support|real person|someone|engineer)\b/i,
  /\b(human\s+support|human\s+agent|live\s+agent|real\s+person|support\s+person)\b/i,
  /\b(call\s+me|call\s+someone|give\s+me\s+a\s+call|reach\s+out\s+to\s+me)\b/i,
  /\b(escalate|transfer\s+me|connect\s+me\s+to)\b/i,
  /\b(i\s+need\s+a\s+human|i\s+want\s+a\s+human|help\s+from\s+human)\b/i,
];

export function detectHumanEscalationIntent(message: string): boolean {
  if (!message) return false;
  return HUMAN_INTENT_PATTERNS.some(regex => regex.test(message));
}

export async function generateGeminiReply(
  history: Array<{ sender: string; content: string }>,
  userMessage: string
): Promise<{ text: string; isHumanRequest: boolean }> {
  const isHumanRequest = detectHumanEscalationIntent(userMessage);

  if (isHumanRequest) {
    return {
      text: "Connecting you with our support team. A representative will assist you right here in this chat shortly.",
      isHumanRequest: true,
    };
  }

  // Format conversation contents for Gemini API
  const contents = [
    {
      role: "user",
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    {
      role: "model",
      parts: [{ text: "Understood. I am ready to represent Simulcast Technologies accurately and assist visitors." }],
    },
  ];

  // Include recent conversation context (last 8 messages)
  const recentHistory = history.slice(-8);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Gemini API Error]", response.status, errText);
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) {
      return { text: sanitizeAiResponse(candidateText), isHumanRequest: false };
    }

    return {
      text: "Thank you for reaching out to Simulcast Technologies. How can we assist you with our broadcast, software or IT engineering services today?",
      isHumanRequest: false,
    };
  } catch (error) {
    console.error("[Gemini Generation Failed]", error);
    // Graceful fallback response
    return {
      text: "Thank you for reaching out to Simulcast Technologies. We specialize in broadcast playout, IPTV/OTT, custom software platforms, AI automation, and network infrastructure in Nepal. Feel free to ask any question or request to speak with a representative right here.",
      isHumanRequest: false,
    };
  }
}
