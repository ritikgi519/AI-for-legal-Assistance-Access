import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";

dotenv.config();

// In-Memory LRU Cache for Analysis Results (High Efficiency & Zero Redundant Compute)
const analysisCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 2; // 2 hours
const MAX_CACHE_ENTRIES = 100;

function getCacheKey(prefix: string, content: string, extra: string = ""): string {
  return crypto.createHash("sha256").update(`${prefix}:${content}:${extra}`).digest("hex");
}

function getFromCache(key: string): any | null {
  const entry = analysisCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    analysisCache.delete(key);
    return null;
  }
  return entry.data;
}

function setInCache(key: string, data: any): void {
  if (analysisCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = analysisCache.keys().next().value;
    if (oldestKey) analysisCache.delete(oldestKey);
  }
  analysisCache.set(key, { data, timestamp: Date.now() });
}

// In-Memory Rate Limiter (Security & DoS Protection)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 60;

// Periodic cleanup of expired rate limit and cache entries to guarantee zero memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
  for (const [key, entry] of analysisCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      analysisCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

function rateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
  const now = Date.now();
  const clientLimit = rateLimitMap.get(ip);

  if (!clientLimit || now > clientLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (clientLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: "Too many requests. Please wait a few minutes before submitting additional documents.",
      retryAfterSeconds: Math.ceil((clientLimit.resetTime - now) / 1000)
    });
  }

  clientLimit.count += 1;
  next();
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `You are Lexisense, an autonomous, highly specialized Legal Intelligence and Document Deconstruction Engine. Your role is educational, analytical, and informational—NOT formal legal representation or legal advice.

Your objective is to ingest complex legal instruments (contracts, policies, agreements, terms of service), dismantle legalese into plain language, audit unilateral risk exposure, simulate downstream operational bottlenecks, and construct a high-leverage consultation briefing for a licensed attorney.

### CORE OPERATIONAL DIRECTIVES

1. STRICT CITATION LOCK (Anti-Hallucination & Verbatim Accuracy):
   - You must never state a legal conclusion, obligation, or risk without quoting the exact verbatim text segment from the source document.
   - The "verbatim_quote" field MUST be an EXACT contiguous copy-paste substring directly from the source instrument. Preserve all original capitalization, punctuation, and wording without alteration. Do not paraphrase or summarize inside "verbatim_quote".
   - If a standard customary protection or covenant is missing (e.g. lack of mutual termination, missing vendor IP indemnity, missing duty to mitigate damages, missing audit rights), explicitly quote: "[OMISSION DETECTED: <specify the exact absent covenant>]".

2. PLAIN-ENGLISH TRANSLATION (8th-Grade Reading Level):
   - Rewrite complex contractual clauses at an 8th-grade reading level.
   - For every clause in "critical_clause_audit", your plain-English translation MUST explicitly and rigorously address:
     1. "Who pays?"
     2. "Who takes the blame?"
     3. "When can they walk away?"
     4. "What happens if things go wrong?"

3. JURISDICTIONAL & ADVISORY BOUNDARIES:
   - Never use absolute directives such as "You must sign this" or "This violates the law."
   - Frame outputs as risk evaluations: "This term presents severe unilateral exposure under general contract standards because..."
   - Always append the mandatory advisory note: "For informational and educational purposes only. Consult certified local counsel before execution."

4. BIAS & RECIPROCITY SCORING (Document Fairness Index 0 to 100):
   - Objectively audit whether covenants (indemnification, liability cap, termination, non-compete, IP ownership, dispute resolution, payment terms) are reciprocal or unilateral.
   - Calibrate the Document Fairness Index (DFI) mathematically:
     * Start at 100 base points.
     * Deduct 15–20 points for each heavily unilateral clause (e.g. uncapped one-way indemnity, $100 or sub-annual liability cap, vendor-only convenience termination).
     * Deduct 10–15 points for moderate imbalances (e.g. unilateral fee shifting, Net-90 payment terms with forfeiture, overbroad non-competes).
     * Deduct 10 points for each omitted standard protective covenant ([OMISSION DETECTED]).
     * 0–40: High Risk / Predatory / Heavily Unilateral
     * 41–70: Moderate Risk / Standard Corporate Terms requiring redlines
     * 71–100: Balanced / Fair Reciprocal Terms

5. STRESS-TEST SCENARIOS ("What-If" Analysis):
   - Trace contractual mechanisms under pressure across interconnected clauses:
     * Failure to pay / milestone breach
     * Early termination without cause
     * IP ownership post-severance / breach of confidential data

### OUTPUT FORMAT
You must return valid, parseable JSON conforming to the requested schema. Return ONLY valid JSON.`;

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    document_overview: {
      type: Type.OBJECT,
      properties: {
        document_title: { type: Type.STRING },
        document_type: { type: Type.STRING },
        parties_identified: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        fairness_index: { type: Type.NUMBER, description: "0 to 100 fairness score" },
        executive_summary: { type: Type.STRING }
      },
      required: ["document_title", "document_type", "parties_identified", "fairness_index", "executive_summary"]
    },
    critical_clause_audit: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          clause_id: { type: Type.STRING },
          clause_category: { type: Type.STRING },
          verbatim_quote: { type: Type.STRING },
          plain_english_meaning: { type: Type.STRING },
          risk_level: { type: Type.STRING, description: "LOW | MEDIUM | HIGH | CRITICAL" },
          party_favored: { type: Type.STRING },
          hidden_pitfalls: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          proposed_redline: { type: Type.STRING }
        },
        required: ["clause_id", "clause_category", "verbatim_quote", "plain_english_meaning", "risk_level", "party_favored", "hidden_pitfalls", "proposed_redline"]
      }
    },
    what_if_stress_tests: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          scenario: { type: Type.STRING },
          consequence_chain: { type: Type.STRING },
          user_protection_level: { type: Type.STRING, description: "Unprotected | Partially Protected | Well Protected" }
        },
        required: ["scenario", "consequence_chain", "user_protection_level"]
      }
    },
    lawyer_consultation_dossier: {
      type: Type.OBJECT,
      properties: {
        top_red_flags_for_discussion: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        high_leverage_questions_for_counsel: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        suggested_walkaway_terms: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["top_red_flags_for_discussion", "high_leverage_questions_for_counsel", "suggested_walkaway_terms"]
    },
    statutory_disclaimer: { type: Type.STRING }
  },
  required: ["document_overview", "critical_clause_audit", "what_if_stress_tests", "lawyer_consultation_dossier", "statutory_disclaimer"]
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Headers via Helmet (optimized for modern web & AI Studio iframe embedding)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Vite inline scripts & dev server require flexibility
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false, // Allows embedding within Google AI Studio preview iframe
      crossOriginResourcePolicy: false,
      originAgentCluster: false,
      frameguard: false, // Allows embedding within Google AI Studio preview
      dnsPrefetchControl: { allow: false },
      xContentTypeOptions: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    })
  );

  // Gzip / Brotli Compression for High Bandwidth Efficiency
  app.use(compression());

  // Strict Request Body Limit to prevent memory exhaustion
  app.use(express.json({ limit: "5mb" }));

  // Apply Rate Limiter to protect all API endpoints
  app.use("/api", rateLimitMiddleware);

  // Health check & Server Status
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      engine: "Lexisense Legal Intelligence Engine v2.4",
      security: {
        rateLimiterActive: true,
        helmetActive: true,
        compressionActive: true
      },
      efficiency: {
        cacheEntries: analysisCache.size,
        compressionEnabled: true
      },
      geminiConfigured: !!process.env.GEMINI_API_KEY
    });
  });

  // Main Analysis Endpoint with Cache and Validation
  app.post("/api/analyze", async (req, res) => {
    try {
      const { documentText, perspective } = req.body;
      
      // Strict Input Validation & Sanitization (Security)
      if (!documentText || typeof documentText !== "string") {
        return res.status(400).json({ error: "Document text is required and must be a string." });
      }

      const cleanText = documentText.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
      if (cleanText.length < 20) {
        return res.status(400).json({ error: "Document text too short. Minimum 20 characters required for legal audit." });
      }
      if (cleanText.length > 150000) {
        return res.status(400).json({ error: "Document text exceeds maximum allowed size (150,000 characters)." });
      }

      const sanitizedPerspective = typeof perspective === "string" ? perspective.slice(0, 200) : "General Neutral Reviewer / Counterparty Protection";

      // Check In-Memory Cache (Efficiency)
      const cacheKey = getCacheKey("analysis", cleanText, sanitizedPerspective);
      const cachedResult = getFromCache(cacheKey);
      if (cachedResult) {
        res.setHeader("X-Cache", "HIT");
        return res.json(cachedResult);
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY environment variable is not configured. Please check Settings > Secrets."
        });
      }

      const prompt = `Analyze the following legal document with strict adherence to the Lexisense directives.
Reviewing Perspective: ${sanitizedPerspective}.

Document Text:
<<<
${cleanText}
>>>`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA as any,
          temperature: 0.1, // Low temperature for high precision and strict verbatim citation
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response generated from model.");
      }

      const parsed = JSON.parse(responseText);

      // Strict Ground-Truth Citation Verification Check against original source text
      if (Array.isArray(parsed.critical_clause_audit)) {
        parsed.critical_clause_audit = parsed.critical_clause_audit.map((clause: any) => {
          const quote = clause.verbatim_quote || "";
          const isOmission = quote.includes("[OMISSION DETECTED]");

          if (isOmission) {
            return {
              ...clause,
              citation_verified: false,
              match_confidence: 0,
              is_omission: true
            };
          }

          const exactIdx = cleanText.indexOf(quote);
          if (exactIdx !== -1) {
            const lineNo = cleanText.slice(0, exactIdx).split("\n").length;
            return {
              ...clause,
              citation_verified: true,
              match_confidence: 100,
              match_offset: exactIdx,
              line_number: lineNo
            };
          }

          const lowerDoc = cleanText.toLowerCase();
          const lowerQuote = quote.toLowerCase();
          const lowerIdx = lowerDoc.indexOf(lowerQuote);
          if (lowerIdx !== -1) {
            const lineNo = cleanText.slice(0, lowerIdx).split("\n").length;
            return {
              ...clause,
              citation_verified: true,
              match_confidence: 95,
              match_offset: lowerIdx,
              line_number: lineNo
            };
          }

          // Normalized match (spaces/line breaks collapsed)
          const normDoc = cleanText.replace(/\s+/g, " ");
          const normQuote = quote.replace(/\s+/g, " ").trim();
          const normIdx = normDoc.indexOf(normQuote);

          return {
            ...clause,
            citation_verified: normIdx !== -1,
            match_confidence: normIdx !== -1 ? 90 : 0
          };
        });
      }

      // Store in Cache for rapid future retrieval
      setInCache(cacheKey, parsed);
      res.setHeader("X-Cache", "MISS");
      return res.json(parsed);
    } catch (err: any) {
      console.error("Error analyzing document:", err);
      return res.status(500).json({
        error: "Failed to analyze document with Lexisense engine. Please check input parameters or retry."
      });
    }
  });

  // Dynamic Custom Scenario Stress Test Endpoint with Cache
  app.post("/api/stress-test", async (req, res) => {
    try {
      const { documentText, customScenario } = req.body;
      if (!documentText || typeof documentText !== "string" || !customScenario || typeof customScenario !== "string") {
        return res.status(400).json({ error: "Both documentText and customScenario are required strings." });
      }

      const cleanDoc = documentText.trim();
      const cleanScenario = customScenario.trim().slice(0, 500);

      // Cache lookup for identical stress test queries
      const cacheKey = getCacheKey("stress", cleanDoc, cleanScenario);
      const cached = getFromCache(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(cached);
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key not configured." });
      }

      const prompt = `Given the legal document below, stress-test this specific operational scenario:
"${cleanScenario}"

Document:
<<<
${cleanDoc}
>>>

Trace the step-by-step consequence chain across interconnected contractual clauses (e.g. Clause X -> Grace Period Y -> Remedy Z), and evaluate whether the user/counterparty is Unprotected, Partially Protected, or Well Protected.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scenario: { type: Type.STRING },
              consequence_chain: { type: Type.STRING },
              user_protection_level: { type: Type.STRING, description: "Unprotected | Partially Protected | Well Protected" },
              relevant_clauses_cited: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              operational_recommendation: { type: Type.STRING }
            },
            required: ["scenario", "consequence_chain", "user_protection_level", "relevant_clauses_cited", "operational_recommendation"]
          } as any,
          temperature: 0.1
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      setInCache(cacheKey, parsed);
      res.setHeader("X-Cache", "MISS");
      return res.json(parsed);
    } catch (err: any) {
      console.error("Error running scenario stress-test:", err);
      return res.status(500).json({ error: "Scenario stress-test could not be completed." });
    }
  });

  // Ask the Attorney AI Chatbot Endpoint (Contextually integrates with Curated Dossier)
  app.post("/api/chat-attorney", rateLimitMiddleware, async (req, res) => {
    try {
      const { messages, curatedDossierItems, documentContext } = req.body;
      
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const lastUserMessage = messages[messages.length - 1]?.content || "";
      if (typeof lastUserMessage !== "string" || !lastUserMessage.trim()) {
        return res.status(400).json({ error: "Last message content is required." });
      }

      const safeItems = Array.isArray(curatedDossierItems) ? curatedDossierItems.slice(0, 25) : [];
      const safeDocContext = typeof documentContext === "object" && documentContext !== null ? documentContext : {};

      // Prepare Structured Dossier Context Block
      const dossierSummary = safeItems.length > 0
        ? safeItems.map((item: any, idx: number) => {
            return `[CURATED CLAUSE ${idx + 1}: ${item.clauseId || "Unknown"} (${item.category || "General Terms"})]
- Priority Tier: ${item.priority || "NORMAL"}
- Risk Level: ${item.riskLevel || "MEDIUM"}
- Party Favored in Source: ${item.partyFavored || "Counterparty"}
- Verbatim Contract Extract: "${(item.verbatimQuote || "").slice(0, 800)}"
- Plain English Translation: "${(item.plainEnglish || "").slice(0, 400)}"
- Proposed Balanced Redline: "${(item.proposedRedline || "").slice(0, 800)}"
- Client Specific Notes & Negotiation Goals: "${item.clientNotes || item.customNote || "Standard consultation"}"`;
          }).join("\n\n")
        : "No specific clauses pinned to curated dossier yet. The user is asking general contract and negotiation strategy questions.";

      const docSummary = `Document Title: ${safeDocContext.title || "Commercial Agreement"}
Document Fairness Index (DFI): ${safeDocContext.fairnessScore ?? "N/A"}/100
General Posture: ${safeDocContext.partyFavored || "Unilateral Counterparty Favor"}`;

      const ai = getGeminiClient();

      if (ai) {
        const systemPrompt = `You are Counsel Strategist, an elite commercial transactions attorney and contract negotiation consultant within the Lexisense intelligence engine.
Your purpose is to provide sophisticated, actionable, pragmatic negotiation advice directly grounded in the client's curated dossier items.

### DOCUMENT BACKGROUND:
${docSummary}

### CURATED DOSSIER OF PINNED CLAUSES & CLIENT NOTES:
${dossierSummary}

### CORE CONSULTATION DIRECTIVES:
1. SPECIFICITY: Directly cite and cross-reference the client's curated clauses (${safeItems.map((i: any) => i.clauseId).filter(Boolean).join(", ") || "general clauses"}), their assigned priority levels, and their custom client notes.
2. TACTICAL PLAYBOOK: Provide concrete counter-arguments, compromise alternatives, and specific redline language the client can propose.
3. LEVERAGE MATRIX: Explain where to stand firm (deal-breakers / walkaway thresholds) versus where pragmatic concessions can be traded for valuable protections.
4. OUTSIDE COUNSEL PREPARATION: Provide 2-3 precise, high-impact questions the client should ask their retained human attorney during formal consultation.
5. FORMATTING: Use clean markdown with clear headers (e.g. ### 1. Strategic Leverage Assessment), bullet points, and blockquotes for suggested legal drafting.
6. DISCLAIMER: Always conclude with a concise educational notice that this analysis is strategic legal intelligence and negotiation preparation, not formal attorney-client legal representation.`;

        const conversationHistory = messages.slice(0, -1).map((m: any) => `${m.role === 'user' ? 'Client' : 'Counsel Strategist'}: ${m.content}`).join("\n\n");
        const fullPrompt = `${conversationHistory ? `Conversation History:\n${conversationHistory}\n\n` : ''}Client Question: ${lastUserMessage}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: fullPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
          }
        });

        const replyText = response.text || "Counsel Strategist was unable to synthesize a response. Please try rephrasing your negotiation question.";

        return res.json({
          reply: replyText,
          timestamp: Date.now(),
          model: "gemini-3.8-flash",
          curatedItemsConsidered: safeItems.length
        });
      }

      // Simulated Attorney Response Fallback when GEMINI_API_KEY is not configured
      const simulatedReply = generateSimulatedAttorneyResponse(lastUserMessage, safeItems, safeDocContext);
      return res.json({
        reply: simulatedReply,
        timestamp: Date.now(),
        model: "simulated-attorney-strategist",
        curatedItemsConsidered: safeItems.length
      });

    } catch (err: any) {
      console.error("Error in /api/chat-attorney:", err);
      return res.status(500).json({ error: "Failed to process attorney chat query." });
    }
  });

  function generateSimulatedAttorneyResponse(
    query: string,
    curatedItems: any[],
    docContext: any
  ): string {
    const queryLower = query.toLowerCase();

    if (curatedItems.length === 0) {
      return `### Strategic Consultation Overview

I am your **AI Legal Strategy Consultant**. Currently, your curated dossier has no pinned clauses loaded.

To give you laser-focused negotiation strategy:
1. Browse the **Clause Audit Cards** and click **Pin to Dossier** on your high-risk or contentious clauses.
2. Add your specific client consultation notes and priority levels (e.g. *"Ask if a 12-month cap is standard for SaaS"*).
3. Return here, and I will analyze those exact covenants, construct counter-proposals, and formulate your negotiation leverage matrix.

In general commercial transactions, remember the cardinal rule of negotiation: **reciprocity**. Any unilateral indemnity, uncapped liability, or immediate termination rights should be countered with bilateral mutuality, 30-day notice and cure periods, and trailing 12-month aggregate fee caps.

*Disclaimer: This strategic analysis is powered by Lexisense AI Legal Intelligence for informational and negotiation preparation purposes only and does not constitute formal attorney-client legal representation.*`;
    }

    const topItem = curatedItems[0];
    const clauseId = topItem?.clauseId || "Curated Covenant";
    const category = topItem?.category || "Commercial Terms";
    const priority = topItem?.priority || "High Priority";
    const clientNote = topItem?.clientNotes || topItem?.customNote || "";

    let strategyContent = "";

    if (queryLower.includes("leverage") || queryLower.includes("trade-off") || queryLower.includes("tradeoff")) {
      strategyContent = `### 1. Strategic Leverage & Trade-Off Matrix
Across your **${curatedItems.length} curated provisions**, your primary exposure point centers on **${clauseId} (${category})** designated as **${priority}**.

- **Primary Stand-Firm Anchor**: Stand firm on demanding mutual reciprocity and a hard dollar or 12-month trailing fee ceiling on **${clauseId}**. Do not budge on uncapped consequential exposure.
- **Tactical Concession Opportunity**: If the counterparty pushes back vigorously, offer them a narrowly tailored carve-out strictly limited to willful misconduct or breach of confidentiality, rather than uncapped general performance exposure.
- **Cross-Clause Leverage**: Use any concessions made in secondary clauses (such as accepting standard payment net-30 terms) as direct trade-off justification for mutualizing **${clauseId}**.`;
    } else if (queryLower.includes("counter") || queryLower.includes("draft") || queryLower.includes("proposal") || queryLower.includes("redline") || queryLower.includes("email")) {
      strategyContent = `### 1. Tactical Counter-Proposal Formulation
To address **${clauseId} (${category})**, here is balanced compromise language modeled after standard ABA and Delaware commercial boilerplate:

> **Recommended Reciprocal Compromise Boilerplate:**
> *"Except for breaches of Section [Confidentiality], gross negligence, or third-party indemnification obligations, neither party's total aggregate liability arising out of or related to this Agreement shall exceed the total fees paid or payable by Customer in the twelve (12) months immediately preceding the claim. In no event shall either party be liable for indirect, incidental, or consequential damages (including loss of revenue or profits)."*

### 2. Commercial Justification Script for Counterparty
- **Bilateral Fairness**: Caps both parties symmetrically rather than creating a one-sided risk sink.
- **Commercial Insurability**: Uncapped general liabilities cannot be economically underwritten by enterprise insurers; standard E&O and cyber policies align with trailing 12-month contract multiples.`;
    } else if (queryLower.includes("walk") || queryLower.includes("threshold") || queryLower.includes("red flag") || queryLower.includes("risk")) {
      strategyContent = `### 1. Critical Walk-Away Thresholds
For **${clauseId}** (evaluated at **${topItem?.riskLevel || "CRITICAL"} Risk**):

- **Absolute Red Line**: Do **not** accept unilateral uncapped liability or nominal token caps ($50 or $100 limits for enterprise services).
- **Secondary Threshold**: Reject any indemnification clause that allows direct intra-party contractual breach claims rather than strictly defending against third-party claims.
- **Default Trigger**: Ensure a mandatory **30-day written notice and cure period** exists before either party can declare an event of default or terminate for cause.`;
    } else {
      strategyContent = `### 1. Strategic Assessment for ${clauseId} (${category})
Based on your designated priority (**${priority}**) ${clientNote ? `and client note (*"${clientNote}"*)` : ""}:

- **Core Risk**: The current instrument is heavily weighted in favor of the counterparty, shifting operational burden and speculative liabilities onto your organization.
- **Market Alignment**: Standard enterprise market practice (NVCA / ABA Model Terms) favors reciprocal covenants, a consequential damages waiver, and an aggregate fee ceiling tied to contract value.
- **Immediate Recommendation**: Counter-propose our balanced reciprocal redline. If the vendor claims this is their "standard non-negotiable form," request an escalation to their commercial legal counsel—business reps frequently have authority to approve reciprocal caps.`;
    }

    return `${strategyContent}

### 2. High-Impact Questions for Your Legal Counsel
When you consult your attorney, present these precise questions regarding your curated dossier:
1. *"For **${clauseId}**, will our commercial general liability and errors & omissions insurance cover the un-waived liabilities under current state governing law?"*
2. *"Can we negotiate a separate 2x super-cap solely for data privacy incidents while maintaining a 1x trailing fee cap for general breach?"*
3. *"Does the current dispute resolution forum create unfavorable procedural burdens for us if we enforce cure remedies?"*

*Disclaimer: This strategic analysis is powered by Lexisense AI Legal Intelligence for informational and negotiation preparation purposes only and does not constitute formal attorney-client legal representation or formal legal advice.*`;
  }

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lexisense server active at http://localhost:${PORT}`);
  });
}

startServer();
