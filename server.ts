import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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

1. STRICT CITATION LOCK (Anti-Hallucination):
   - You must never state a legal conclusion, obligation, or risk without quoting the exact verbatim text segment from the source document.
   - If a clause does not exist or is missing standard protections (e.g., lack of mutual termination, missing force majeure), explicitly mark it as: "[OMISSION DETECTED]".

2. PLAIN-ENGLISH TRANSLATION:
   - Rewrite complex contractual clauses at an 8th-grade reading level.
   - Clearly identify: "Who pays?", "Who takes the blame?", "When can they walk away?", and "What happens if things go wrong?"

3. JURISDICTIONAL & ADVISORY BOUNDARIES:
   - Never use absolute directives such as "You must sign this" or "This violates the law."
   - Frame outputs as risk evaluations: "This term presents severe unilateral exposure under general contract standards because..."
   - Always append the mandatory advisory note: "For informational and educational purposes only. Consult certified local counsel before execution."

4. BIAS & RECIPROCITY SCORING:
   - Evaluate whether covenants (indemnification, non-compete, confidentiality, termination, liquidated damages) are mutual or unilateral.
   - Assign an objective Document Fairness Index (DFI) from 0 to 100:
     * 0–40: High Risk / Predatory / Heavily Unilateral
     * 41–70: Moderate Risk / Standard Corporate Terms requiring redlines
     * 71–100: Balanced / Fair Reciprocal Terms

5. STRESS-TEST SCENARIOS ("What-If" Analysis):
   - Trace contractual mechanisms under pressure across interconnected clauses:
     * Failure to pay / milestone breach
     * Early termination without cause
     * IP ownership post-severance

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

  app.use(express.json({ limit: "15mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      engine: "Lexisense Legal Intelligence Engine v2.4",
      geminiConfigured: !!process.env.GEMINI_API_KEY
    });
  });

  // Main Analysis Endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { documentText, perspective } = req.body;
      if (!documentText || typeof documentText !== "string" || documentText.trim().length === 0) {
        return res.status(400).json({ error: "Document text is required for analysis." });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY environment variable is not configured. Please check Settings > Secrets."
        });
      }

      const prompt = `Analyze the following legal document with strict adherence to the Lexisense directives.
Reviewing Perspective: ${perspective || "General Neutral Reviewer / Counterparty Protection"}.

Document Text:
<<<
${documentText.trim()}
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
      return res.json(parsed);
    } catch (err: any) {
      console.error("Error analyzing document:", err);
      return res.status(500).json({
        error: err?.message || "Failed to analyze document with Lexisense engine."
      });
    }
  });

  // Dynamic Custom Scenario Stress Test Endpoint
  app.post("/api/stress-test", async (req, res) => {
    try {
      const { documentText, customScenario } = req.body;
      if (!documentText || !customScenario) {
        return res.status(400).json({ error: "Both documentText and customScenario are required." });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key not configured." });
      }

      const prompt = `Given the legal document below, stress-test this specific operational scenario:
"${customScenario}"

Document:
<<<
${documentText}
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
      return res.json(parsed);
    } catch (err: any) {
      console.error("Error running scenario stress-test:", err);
      return res.status(500).json({ error: err?.message || "Scenario stress-test failed." });
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
