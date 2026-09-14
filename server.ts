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
