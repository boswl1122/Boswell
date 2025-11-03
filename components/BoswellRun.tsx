import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigation } from "lucide-react";

export default function BoswellRun() {
  type Tab = "prep" | "generate";
  const [tab, setTab] = useState<Tab>("prep");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const isDark = theme === "dark";

  // ----- Config -----
  const [kb, setKb] = useState("All Research Materials");
  const [chapter, setChapter] = useState("");
  const [subject, setSubject] = useState("Jim Barksdale");
  const [goal, setGoal] = useState(
    "Chronology, key quotes, key scenes, and all information related to this chapter (enough for a full draft)."
  );
  const [notes, setNotes] = useState("");
  const [openingStyle, setOpeningStyle] = useState("Open with a vivid, grounded scene from the start of the chapter's timeline. Capture the tension without revealing outcomes or skipping ahead.");

  // AI Model Selection
  const [selectedModel, setSelectedModel] = useState("grok-4-fast-reasoning");
  const [availableModels] = useState([
    { id: "claude-opus-4-1-20250805", name: "Claude Opus 4.1", provider: "Anthropic", contextLength: 200000, maxTokens: 28000 },
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "Anthropic", contextLength: 200000, maxTokens: 28000 },
    { id: "gpt-5", name: "GPT-5", provider: "OpenAI", contextLength: 400000, maxTokens: 128000 },
    { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI", contextLength: 400000, maxTokens: 128000 },
    { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI", contextLength: 1000000, maxTokens: 32768 },
    { id: "grok-4-fast-reasoning", name: "Grok 4 Fast (Reasoning)", provider: "X.ai", contextLength: 256000, maxTokens: 100000 },
    { id: "grok-4-fast-non-reasoning", name: "Grok 4 Fast", provider: "X.ai", contextLength: 256000, maxTokens: 100000 },
  ]);

  const selectedModelInfo = availableModels.find(m => m.id === selectedModel);

  // Voice guide / exemplar
  const [voiceGuide, setVoiceGuide] = useState(() => {
    const baseGuide = `Voice Guide
- ${openingStyle || "Open with a vivid, grounded scene from the start of the chapter's timeline. Capture the tension without revealing outcomes or skipping ahead."}
- After the opener: strict chronology (no time-jumps/flashbacks).
- Balance scene and exposition; include concrete physical detail.
- Quotes: introduce speaker + circumstance; group quotes to build an idea.
- 1-6 sentences per paragraph
- Prefer commas/periods over em dashes; steady, explanatory tone.
- Every detail must advance the narrative or reveal character.
- End with a concrete scene or single sharp observation
- NO summarizing themes or lessons learned
- NO heavy-handed foreshadowing about future success
- NO philosophical reflections - just stop when the chronology ends
- Maximum ONE short concluding paragraph if needed
- When someone new appears, briefly establish who they are in relation to the protagonist
- Let scenes carry meaning without explaining them
`;
    return baseGuide;
  });

  const [voiceExemplar, setVoiceExemplar] = useState(`He was slow in learning how to talk. “My parents were so worried,” he later recalled, “that they consulted a doctor.” Even after he had begun using words, sometime after the age of 2, he developed a quirk that prompted the family maid to dub him “der Depperte,” the dopey one, and others in his family to label him as “almost backwards.” Whenever he had something to say, he would try it out on himself, whispering it softly until it sounded good enough to pronounce aloud. “Every sentence he uttered,” his worshipful younger sister recalled, “no matter how routine, he repeated to himself softly, moving his lips.” It was all very worrying, she said. “He had such difficulty with language that those around him feared he would never learn.” ¹ His slow development was combined with a cheeky rebelliousness toward authority, which led one schoolmaster to send him packing and another to amuse history by declaring that he would never amount to much. These traits made Albert Einstein the patron saint of distracted school kids everywhere.² But they also helped to make him, or so he later surmised, the most creative scientific genius of modern times. His cocky contempt for authority led him to question received wisdom in ways that well-trained acolytes in the academy never contemplated. And as for his slow verbal development, he came to believe that it allowed him to observe with wonder the everyday phenomena that others took for granted. “When I ask myself how it happened that I in particular discovered the relativity theory, it seemed to lie in the following circumstance,” Einstein once explained. “The ordinary adult never bothers his head about the problems of space and time. These are things he has thought of as a child. But I developed so slowly that I began to wonder about space and time only when I was already grown up. Consequently, I probed more deeply into the problem than an ordinary child would have.” ³ Einstein’s developmental problems have probably been exaggerated, perhaps even by himself, for we have some letters from his adoring grandparents saying that he was just as clever and endearing as every grandchild is. But throughout his life, Einstein had a mild form of echolalia, causing him to repeat phrases to himself, two or three times, especially if they amused him. And he generally preferred to think in pictures, most notably in famous thought experiments, such as imagining watching lightning strikes from a moving train or experiencing gravity while inside a falling elevator. “I very rarely think in words at all,” he later told a psychologist. “A thought comes, and I may try to express it in words afterwards.”⁴ Einstein was descended, on both parents’ sides, from Jewish tradesmen and peddlers who had, for at least two centuries, made modest livings in the rural villages of Swabia in southwestern Germany. With each generation they had become, or at least so they thought, increasingly assimilated into the German culture that they loved. Although Jewish by cultural designation and kindred instinct, they displayed scant interest in the religion or its rituals. Einstein regularly dismissed the role that his heritage played in shaping who he became. “Exploration of my ancestors,” he told a friend late in life, “leads nowhere.”⁵ That’s not fully true. He was blessed by being born into an independent-minded and intelligent family line that valued education, and his life was certainly affected, in ways both beautiful and tragic, by membership in a religious heritage that had a distinctive intellectual tradition and a history of being both outsiders and wanderers. Of course, the fact that he happened to be Jewish in Germany in the early twentieth century made him more of an outsider, and more of a wanderer, than he would have preferred—but that, too, became integral to who he was and the role he would play in world history. Einstein’s father, Hermann, was born in 1847 in the Swabian village of Buchau, whose thriving Jewish community was just beginning to enjoy the right to practice any vocation. Hermann showed “a marked inclination for mathematics,”⁶ and his family was able to send him seventy-five miles north to Stuttgart for high school. But they could not afford to send him to a university, most of which were closed to Jews in any event, so he returned home to Buchau to go into trade. A few years later, as part of the general migration of rural German Jews into industrial centers during the late nineteenth century, Hermann and his parents moved thirty-five miles away to the more prosperous town of Ulm, which prophetically boasted as its motto “Ulmenses sunt mathematici,” the people of Ulm are mathematicians.⁷ There he became a partner in a cousin’s featherbed company. He was “exceedingly friendly, mild and wise,” his son would recall.⁸ With a gentleness that blurred into docility, Hermann was to prove inept as a businessman and forever impractical in financial matters. But his docility did make him well suited to be a genial family man and good husband to a strong-willed woman. At age 29, he married Pauline Koch, eleven years his junior.`);

  // ----- NotebookLM outputs -----
  const [nbOut1, setNbOut1] = useState(""); // Step 2A
  const [nbOut2, setNbOut2] = useState(""); // Step 2B
  const [nbOut3, setNbOut3] = useState(""); // Step 2C

  // ----- AI generation state -----
  const [aiOutput, setAiOutput] = useState("");
  const [displayedOutput, setDisplayedOutput] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);
  const [generationStats, setGenerationStats] = useState({
    wordsPerMinute: 0,
    startTime: 0,
    estimatedCompletion: "",
  });

  // UI feedback
  const [status, setStatus] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // ===== TUTORIAL MODE ADDITION - START =====
  const [tutorialMode, setTutorialMode] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);
  const totalTutorialSteps = 6;

  const tutorialSteps = [
    {
      step: 1,
      title: "Project Setup",
      description: "First, let's configure your biographical chapter project",
      fields: ["chapter", "subject", "goal"],
      canProceed: () => chapter.trim().length > 0
    },
    {
      step: 2,
      title: "NotebookLM Step 2A",
      description: "Copy this prompt to NotebookLM to gather context and chronology",
      fields: ["nbPrompt1"],
      canProceed: () => nbOut1.trim().length > 0
    },
    {
      step: 3,
      title: "NotebookLM Step 2B", 
      description: "Copy this prompt to NotebookLM to gather detailed evidence",
      fields: ["nbPrompt2"],
      canProceed: () => nbOut2.trim().length > 0
    },
    {
      step: 4,
      title: "NotebookLM Step 2C",
      description: "Copy this prompt to NotebookLM to create narrative bridges",
      fields: ["nbPrompt3"],
      canProceed: () => nbOut3.trim().length > 0
    },
    {
      step: 5,
      title: "Voice Customization",
      description: "Customize your writing style (optional)",
      fields: ["voiceGuide"],
      canProceed: () => true
    },
    {
      step: 6,
      title: "Generate Chapter",
      description: "Review and generate your biographical chapter",
      fields: ["final"],
      canProceed: () => nbOut1.trim().length > 0 && nbOut2.trim().length > 0 && nbOut3.trim().length > 0
    }
  ];

  const currentTutorialStep = tutorialSteps[tutorialStep - 1];
  // ===== TUTORIAL MODE ADDITION - END =====

  // Simple text display - no streaming animation for now
  useEffect(() => {
    setDisplayedOutput(aiOutput);
  }, [aiOutput]);

  // Auto-scroll AI output with smooth animation
  const outputRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [displayedOutput]);

  // Keep overlay height stable when the mobile keyboard opens/closes
  useEffect(() => {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;
    const setVvh = () => {
      document.documentElement.style.setProperty('--vvh', `${vv.height}px` );
    };
    setVvh();
    vv.addEventListener('resize', setVvh);
    vv.addEventListener('scroll', setVvh);
    return () => {
      vv.removeEventListener('resize', setVvh);
      vv.removeEventListener('scroll', setVvh);
    };
  }, []);

  // Copy helper
  async function copy(text: string) {
    try {
      if ((navigator as any)?.clipboard && (window as any).isSecureContext) {
        await navigator.clipboard.writeText(text);
        setStatus("Copied to clipboard");
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        ta.setAttribute("readonly", "");
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        setStatus(ok ? "Copied to clipboard" : "Copy blocked — select & copy manually");
      } catch {
        setStatus("Copy blocked — select & copy manually");
      }
    } finally {
      setTimeout(() => setStatus(null), 1400);
    }
  }

  // ----- Prompts -----
  const nbPrompt1 = useMemo(
    () =>
      `# SYSTEM PROMPT — 2A (Chronology Framework)
Knowledge Base: ${kb}
Chapter: ${chapter || "[Insert Chapter Title]"}
Main Subject: ${subject || "[Insert Subject]"}
Goal: ${goal}
Context notes (optional): ${notes || "(none)"}
---
TASK
Produce "2A. Chronology Framework."
---
RULES
- Chapter Window: [YYYY-MM → YYYY-MM]. ≥80% TPs must be [IN-SCOPE]. Events outside = [ADJACENT] (only in Adjacent Context/Parking Lot). If ≥50% Adjacent → rebuild with in-window events.
- Dates: Normalize to YYYY-MM + (Age ~N). If sources differ by ≥1 month → flag [DISCREPANCY: …] {IDs}.
- Tags & Citations: Each TP ends with [IN-SCOPE|ADJACENT] {IDs}.
- Scenes: ≥1 scene detail (setting, artifact, sensory) per TP.
- Counts: Context ≤120 words (≤2 [ADJACENT]); Chronology 6–10 TPs (1–2 sentences each); Cast ≤12; Adjacent Context 3–7; Parking Lot 1–3.
- Numbers/Artifacts: If equity %, deal $, headcount, or props appear → add Fact Table note.
---
OUTPUT
- 2A. One-paragraph Context
- 2A. Chronology — Turning Points
  Format: N. YYYY-MM — Title (Age ~N) — 1–2 sentences + scene. [IN-SCOPE|ADJACENT] {IDs}
- 2A. Cast of Characters (≤12; grouped)
- 2A. Adjacent Context That Shapes Decisions (3–7 [ADJACENT])
- 2A. Parking Lot (1–3; note why excluded)
- (If present) Fact Table note
---
COMPLIANCE FOOTER
Tags on every TP [YES/NO] • Dates normalized [YES/NO] • ≥80% IN-SCOPE [YES/NO] (X/Y) • Discrepancies flagged [YES/NO] • Context ≤120 words [YES/NO]`,
    [kb, chapter, goal, notes, subject]
  );

  const nbPrompt2 = useMemo(
    () =>
      `# SYSTEM PROMPT — 2B (Expanded Evidence)
Knowledge Base: ${kb}
Chapter: ${chapter || "[Insert Chapter Title]"}
Main Subject: ${subject || "[Insert Subject]"}
Goal: ${goal}
Context notes (optional): ${notes || "(none)"}
---
INPUT
Use the 2A Chronology — Turning Points list exactly as written (no new events).
---
TASK
Produce "2B. Expanded Evidence."
---
HARD RULES
- Do not add or remove TPs. Expand each TP from 2A only.
- Every bullet (quote, paraphrase, scene, number) ends with {SourceIDs}. No implied sources.
- Per-TP Minimums:
  – ≥3 direct quotes (if fewer exist: add [QUOTES<3: not available] {IDs}).
  – Scene Card mandatory (place, people, prop/sensory).
  – End with a Because → Therefore causal line linking to next TP or consequence.
- Concepts & Numbers: When technical/financial terms or numbers appear, echo them in the Fact Table and add Concept Explainers (≤80 words, with {IDs}).
- Bibliography hygiene: Include only sources actually cited in 2B.
---
OUTPUT SECTIONS
- 2B. Expanded Report per Turning Point (TP-ordered)
  – Recap (1–2 sentences)
  – People Involved (name; role; relation)
  – Evidence (quotes, paraphrase nuance, Scene Card, numbers/artifacts, relationship/attitude shifts)
  – Because → Therefore line
- 2B. Dialogue Bank (≥8 vivid verbatim lines)
- 2B. Concept Explainers (≤80 words each; with {IDs})
- 2B. Fact Table (numeric values + artifacts consolidated; with {IDs})
- 2B. Bibliography (cited-only)
---
COMPLIANCE REPORT
≥3 quotes per TP or flagged [YES/NO] • Scene Card per TP [YES/NO] • Because→Therefore per TP [YES/NO] • SourceIDs on all facts [YES/NO] • Dialogue Bank ≥8 lines [YES/NO] • Bibliography cited-only [YES/NO]`,
    [kb, chapter, goal, notes, subject]
  );

  const nbPrompt3 = useMemo(
    () =>
      `# SYSTEM PROMPT — 2C (Narrative Bridges)
Knowledge Base: ${kb}
Chapter: ${chapter || "[Insert Chapter Title]"}
Main Subject: ${subject || "[Insert Subject]"}
Goal: ${goal}
Context notes (optional): ${notes || "(none)"}
---
INPUT
Use 2A Turning Points (+ 2B Dialogue Bank & Concept Explainers).
---
TASK
Produce "2C. Narrative Bridges."
---
HARD RULES
- Length: 400–550 words, continuous prose.
- Order: Follow exact TP order.
- Per-TP Minimum Detail: Each TP must include ≥1 specific detail from 2B (quote, number, artifact, or adjacent context).
- Transitions: Use ≥2 explicit Because → Therefore.
- Time Anchors: End every paragraph with a (YYYY-MM) anchor.
- Quotes: Weave ≥4 Dialogue Bank lines (verbatim) with {IDs}.
- Explainer: Insert ≥1 Concept Explainer inline (e.g., SSL, cash flow, equity) with {IDs}.
- Scenes: ≥1 vivid scene detail per paragraph (hotel dinner, resignation office, holiday cabin, first-week triage).
- Discrepancy: If any exist in 2A/2B numbers or dates, call out ≥1 [DISCREPANCY] explicitly in prose (with both {IDs}).
- Citations: Every fact/quote/explainer ends with {IDs}.
---
OUTPUT
- 2C. Narrative Bridges (400–550 words, flow-focused)
---
COMPLIANCE REPORT
Word count 400–550 [YES/NO] • ≥2 Because→Therefore [YES/NO] • Time anchors per paragraph [YES/NO] • ≥4 Dialogue quotes used [YES/NO] • ≥1 Concept Explainer [YES/NO] • ≥1 Discrepancy flagged [YES/NO] • SourceIDs on all facts [YES/NO]`,
    [kb, chapter, goal, notes, subject]
  );

  // Voice guide / exemplar
  const aiSystemHeader = useMemo(
    () =>
      `You are writing an ORIGINAL biography chapter in the STYLE of Walter Isaacson.
This is NOT from any existing Isaacson book - it is original content for a new biography.
You are not pretending to be Isaacson, just using his biographical writing techniques.

ASSIGNMENT
- Chapter: ${chapter || "(unspecified)"}
- Knowledge Base: ${kb}
- Research Goal: ${goal}
- Main Subject: ${subject || "(unspecified)"}

WRITING DIRECTIVES
1) OPENING
 - ${openingStyle || "Begin with a vivid, cinematic scene that captures the chapter's central tension."}
 - Ground time, place, characters, and stakes immediately.
2) STRUCTURE
 - After the opener, maintain strict chronological order. No flashbacks or "meanwhile" jumps.
 - Weave background context into the flow (avoid frequent subheads).
3) PROSE & STYLE
 - SLOW, PATIENT, IMMERSIVE writing that dwells in scenes rather than rushing through events.
 - When you reach an important moment, EXPAND it using NotebookLM outputs first (quotes, scene details, artifacts). You may add basic external context only if it’s obvious, factual, and necessary for reader understanding (e.g., what a stock split is, what AT&T was in 1994). Keep such context brief and neutral; if a detail isn’t in sources, omit it and log it in Editor’s Notes.
 - All detail should illuminate character, stakes, or context. Avoid generic filler; background is welcome when it clarifies or enriches the scene.
 - Use 1–6 sentence paragraphs, varied in rhythm.
 - No invented settings or specific sensory filler. Use only sensory or environmental details that are either (a) directly supported by sources, or (b) safely inferred from broad context (e.g., time of year, region, or known conditions). Avoid high-inference or decorative imagery (smells, sounds, colors, or tactile detail) unless explicitly documented.
 - For crucial moments, slow time down — a 5-minute conversation may take 3–4 full paragraphs.
 - SENSORY DISCIPLINE
	  - Sensory description must come from logical inference, not imagination.
	  - Acceptable inference: general atmosphere (season, climate, light, noise level typical of setting).
	  - Unacceptable inference: specific, unverifiable imagery (smells, unique objects, colors, tastes, invented gestures).
	  - When uncertain about a sensory detail’s factual grounding, omit it.
    - Aim for atmosphere through pacing, tone, and observed action—not decorative description.
4) SCENE DEVELOPMENT
 - Introduce every quote with scene framing (where, who, what just happened).
 - After each, pause for reaction and subtext (expressions, silences, what was implied).
 - For important scenes: develop them fully, like a cinematic sequence. Ground readers in setting, time, and stakes before dialogue. Use NotebookLM quotes and evidence as anchors. 
 - Favor long verbatim quotes from 2B Dialogue Bank when available. If no direct quote exists, paraphrase neutrally and cite.
 - Insert contextual explainers only when essential (e.g., how cellular towers worked, what Netscape Navigator was).
 - Length Guidance: Major scenes should run 800–1,200 words; transitional passages 300–500. Do not pad with invented sensory detail; deepen with sourced evidence, reactions, and precise context.
5) PACING REQUIREMENTS
 - Identify the 5-7 most important scenes/moments from the research
 - You do not need to include every fact. Select only what reveals character, stakes, or tension. Do not invent detail.
 - If you must add outside context, flag it as basic factual background and keep it brief (e.g., what a stock split is).
 - Prioritize NotebookLM evidence first, supplement with light background only when necessary for clarity.
 - Better to fully develop 5 scenes than mention 20 superficially
 - When you uncover something meaningful, STOP AND EXPLORE IT FULLY. Slow down in each scene: dialogue, gestures, atmosphere, consequences.
 - For family scenes, capture the dynamics in detail
 - Use NotebookLM 2B Dialogue Bank and evidence bullets to enrich.
6) LENGTH REQUIREMENT
 - Generate 18k–22k tokens tokens through SCENIC DEPTH, not padding
 - This naturally creates 7,000-8,000 words through proper scene development
 - Do not conclude until you've fully developed at least 5-7 major scenes
 - If approaching the endpoint before this length, deepen existing scenes rather than rushing to conclude

AVOID
- Generic business jargon; excessive subheads; time jumps; editorializing beyond sources.

MANDATORY SCOPE ADHERENCE
- The chapter MUST end at the endpoint defined by the chapter name/title
- NEVER extend beyond what the chapter name specifies to fill remaining tokens
- If approaching the endpoint before target length: develop existing scenes more deeply rather than continuing timeline
- Scope violations are unacceptable - better an underdeveloped chapter than one that exceeds its boundaries

OUTPUT
- A single continuous narrative chapter (18,000-22,000 tokens minimum).
- End with a short "Editor's Notes" (gaps/fact-check list) and a brief bibliography pointer to NB-LM citations.

Final Reminder
- If a detail cannot be supported by NotebookLM sources or obvious factual background, omit it.
- Log any gaps, uncertainties, or missing context in the Editor’s Notes at the end of the chapter.

SOURCE MATERIALS CONTEXT
The following outputs are NOT equal chapters. 
They are staged research artifacts for you to write a full chapter, each with a different role
- STEP 2A: Chronology & Cast. 
  Skeleton timeline of turning points (with dates) and key people. 
  Role = establish strict chronology and the cast of characters. 
  Think of this as the “bones” of the chapter.
- STEP 2B: Evidence Bank. 
  Expanded detail for each turning point, including quotes, scene cards, numbers, and concept explainers. 
  Role = provide factual “meat” and narrative raw material. 
  This is the **primary evidence base**. 
  Use it to build authentic Isaacson-style scenes.
- STEP 2C: Narrative Bridges. 
  Short practice passages (400–550 words) that demonstrate how to weave 2A + 2B into flowing prose. 
  Role = stylistic model for transitions, pacing, and causal logic. 
  **Important:** 2C is only an example of how to connect material.

Together:  
- 2A = bones (timeline + cast)  
- 2B = meat (quotes, detail, evidence)  
- 2C = connective tissue demo (style only)

Use this staged material to generate the full chapter.

SOURCE MATERIALS FOLLOW
[VOICE GUIDE]`,
    [kb, chapter, goal, subject, openingStyle]
  );

  const assembledAiPrompt = useMemo(() => {
    const parts: string[] = [];
    parts.push(aiSystemHeader);
    parts.push(voiceGuide.trim());
    if (voiceExemplar.trim()) parts.push("\n[STYLE EXEMPLAR — tone only]\n" + voiceExemplar.trim());
    parts.push("\n[NOTEBOOKLM OUTPUT — STEP 2A]\n" + (nbOut1.trim() || "(paste Step 2A here)"));
    parts.push("\n[NOTEBOOKLM OUTPUT — STEP 2B]\n" + (nbOut2.trim() || "(paste Step 2B here)"));
    parts.push("\n[NOTEBOOKLM OUTPUT — STEP 2C]\n" + (nbOut3.trim() || "(paste Step 2C here)"));
    parts.push(`\nCRITICAL GENERATION INSTRUCTIONS
    - Write SLOWLY and CINEMATICALLY - luxuriate in important scenes
    - Each scene is an opportunity to immerse the reader - take your time
    - Before adding any sensory description, pause to confirm it is either sourced or logically inevitable from context.
    - When you find a powerful moment in the research, expand it into a full scene
    - Do not rush through chronology - better to deeply explore fewer moments
    - Minimum 12,000 tokens through scenic depth and careful exploration
    - If you feel the urge to summarize or conclude, instead zoom into another scene and develop it fully`);
    return parts.join("\n\n");
  }, [aiSystemHeader, voiceGuide, voiceExemplar, nbOut1, nbOut2, nbOut3]);

  const startsWithRole = assembledAiPrompt.trimStart().toLowerCase().startsWith("you are writing");
  const hasTaskLine = assembledAiPrompt.includes("ASSIGNMENT");

  // ----- Streaming helpers -----
  async function streamOnce(body: Record<string, any>, onChunk: (t: string) => void, signal: AbortSignal) {
    const res = await fetch("/api/chat", {    
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok || !res.body) {
      const txt = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${txt || res.statusText}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  }

  async function runAi() {
    setAiError(null);
    setLoadingAi(true);
    setAiOutput("");
    setDisplayedOutput("");
    
    const startTime = Date.now();
    setGenerationStats({
      wordsPerMinute: 0,
      startTime,
      estimatedCompletion: "Starting...",
    });

    const controller = new AbortController();
    setAbortCtrl(controller);

    try {
      // Use the maxTokens from the selected model's configuration
      const modelMaxTokens = selectedModelInfo?.maxTokens || 100000;
      
      // Determine if model uses max_tokens or max_completion_tokens
      const isOpenAINewModel = ['gpt-5', 'gpt-5-mini', 'gpt-4.1'].includes(selectedModel);
      
      const requestBody = {
        prompt: assembledAiPrompt,
        model: selectedModel,
        ...(isOpenAINewModel 
          ? { maxCompletionTokens: modelMaxTokens }
          : { maxTokens: modelMaxTokens }
        ),
      };
      
      console.log("[UI DEBUG] Sending to API:", {
        model: selectedModel,
        tokenParam: isOpenAINewModel ? 'maxCompletionTokens' : 'maxTokens',
        tokenValue: modelMaxTokens,
        promptLength: assembledAiPrompt.length
      });
      
      await streamOnce(
        requestBody,
        (chunk) => {
          setAiOutput((prev) => {
            const newOutput = prev + chunk;
            
            // Update generation stats
            const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
            const words = (newOutput.match(/\b\w+\b/g) || []).length;
            const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
            const targetWords = 7000;
            const remainingWords = Math.max(0, targetWords - words);
            const estimatedMinutes = wpm > 0 ? Math.round(remainingWords / wpm) : 0;
            
            setGenerationStats({
              wordsPerMinute: wpm,
              startTime,
              estimatedCompletion: estimatedMinutes > 0 ? `~${estimatedMinutes}m remaining` : "Nearly complete",
            });
            
            return newOutput;
          });
        },
        controller.signal
      );
    } catch (e: any) {
      if (e?.name === "AbortError") setAiError("Stopped by user");
      else setAiError(e?.message || "Stream failed");
    } finally {
      setLoadingAi(false);
      setAbortCtrl(null);
    }
  }

  function stopAi() {
    if (abortCtrl) {
      abortCtrl.abort();
      setAbortCtrl(null);
      setLoadingAi(false);
    }
  }

  function runAndOpenGenerateTab() {
    if (!chapter.trim()) {
      setStatus("Add a Chapter first — it feeds the ASSIGNMENT line");
      return;
    }
    setTab("generate");
    setTimeout(() => runAi(), 80);
  }

  // Export functions
  const exportAsText = () => {
    const blob = new Blob([aiOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chapter || 'chapter'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyFormattedOutput = async () => {
    const formatted = `# ${chapter || 'Biography Chapter'}\n\n${aiOutput}`;
    await copy(formatted);
  };

  const counts = useMemo(() => {
    const text = assembledAiPrompt || "";
    const words = (text.match(/\b\w+\b/g) || []).length;
    return { chars: text.length, words };
  }, [assembledAiPrompt]);

  const nb1Counts = useMemo(
    () => ({ words: (nbOut1.match(/\b\w+\b/g) || []).length, chars: nbOut1.length }),
    [nbOut1]
  );
  const nb2Counts = useMemo(
    () => ({ words: (nbOut2.match(/\b\w+\b/g) || []).length, chars: nbOut2.length }),
    [nbOut2]
  );
  const nb3Counts = useMemo(
    () => ({ words: (nbOut3.match(/\b\w+\b/g) || []).length, chars: nbOut3.length }),
    [nbOut3]
  );
  const aiCounts = useMemo(
    () => ({ words: (aiOutput.match(/\b\w+\b/g) || []).length, chars: aiOutput.length }),
    [aiOutput]
  );

  // CONSISTENT BRAND COLOR - using your exact HSL value everywhere
  const BRAND_COLOR = 'hsl(35, 70%, 45%)';

  // Clean styling without conflicting Tailwind classes
  const pageBg = isDark
    ? "bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100"
    : "text-stone-800";
  const pageStyle = isDark 
    ? {} 
    : { 
        background: "linear-gradient(180deg, hsl(39, 31%, 97%), hsl(39, 28%, 95%))",
        minHeight: "100vh"
      };
  const headerBg = isDark ? "bg-stone-900/95 backdrop-blur-xl" : "bg-stone-50/95 backdrop-blur-xl";
  const border = isDark ? "border-stone-700/50" : "border-stone-200";
  const panel = isDark 
    ? "bg-stone-900/90 backdrop-blur-sm border border-stone-700/50 shadow-xl shadow-black/10" 
    : "bg-white/80 backdrop-blur-sm border border-stone-200 shadow-lg shadow-amber-500/5";
  const input = isDark
    ? "bg-stone-800/90 border-stone-600/50 text-stone-100 placeholder:text-stone-400 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 text-sm"
    : "bg-white border-2 border-stone-300 text-stone-800 placeholder:text-stone-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-sm transition-all duration-300 text-sm";
  const subtle = isDark ? "text-stone-400" : "text-stone-600";
  const muted = isDark ? "text-stone-500" : "text-stone-500";
  const link = isDark ? "text-amber-300 hover:text-amber-200 transition-colors duration-300" : "text-amber-600 hover:text-amber-700 transition-colors duration-300";
  const btnSecondary = isDark 
    ? "bg-stone-800/80 hover:bg-stone-700/80 border border-stone-600/50 text-stone-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 focus:outline-none" 
    : "bg-white hover:bg-stone-50 border-2 border-stone-300 hover:border-stone-800 text-stone-700 hover:text-stone-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 focus:outline-none";

  return (
     <div className={`boswell-root min-h-screen overflow-x-hidden ${pageBg}`} style={pageStyle}>
      {/* Enhanced sticky header */}
      <div className={`sticky top-0 z-30 ${headerBg} border-b ${border} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Boswell logo */}
            <img
              src="/logo.png"
              alt="Boswell"
              className="w-16 h-16"
              aria-label="Boswell"
            />
            <div>
              <h1 
                className="text-4xl font-black tracking-tight mb-2"
                style={{ 
                  fontFamily: 'Playfair Display, Georgia, serif',
                  color: isDark ? '#f1f5f9' : 'hsl(25, 25%, 12%)'
                }}
              >
                Boswell Run Console
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <div className={`w-2 h-2 rounded-full bg-amber-500 animate-pulse`}></div>
                <p className={`text-sm font-medium ${muted}`}>
                  Biographical Chapter Generation System
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* ===== TUTORIAL MODE BUTTON - START ===== */}
            <button
              onClick={() => setTutorialMode(!tutorialMode)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-300 hover:scale-105 focus:outline-none"
              style={{
                borderColor: BRAND_COLOR,
                color: tutorialMode ? 'white' : BRAND_COLOR,
                backgroundColor: tutorialMode ? BRAND_COLOR : 'transparent'
              }}
            >
              <Navigation className="w-4 h-4" />
              Guide Me
            </button>
            {/* ===== TUTORIAL MODE BUTTON - END ===== */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`px-5 py-3 rounded-lg text-sm font-medium ${btnSecondary}`}
            >
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ===== TUTORIAL OVERLAY - START ===== */}
        {tutorialMode && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-6"
            onClick={(e) => {
              // Close if clicking the overlay background
              if (e.target === e.currentTarget) {
                setTutorialMode(false);
              }
            }}
          >
            <div className={`max-w-2xl w-full rounded-xl ${panel} p-8 relative`}>
              {/* Tutorial Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: BRAND_COLOR }}>
                    {currentTutorialStep.title}
                  </h2>
                  <p className={`text-sm ${muted} mt-1`}>
                    Step {tutorialStep} of {totalTutorialSteps}
                  </p>
                </div>
                <button
                  onClick={() => setTutorialMode(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${btnSecondary}`}
                >
                  Exit Guide
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-stone-200 rounded-full h-2 mb-6">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(tutorialStep / totalTutorialSteps) * 100}%`,
                    backgroundColor: BRAND_COLOR 
                  }}
                ></div>
              </div>

              {/* Tutorial Content */}
              <div className="mb-8">
                <p className={`text-base ${subtle} mb-6 leading-relaxed`}>
                  {currentTutorialStep.description}
                </p>

                {/* Step-specific content */}
                {tutorialStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: BRAND_COLOR }}>
                        Chapter Title *
                      </label>
                      <input
                        className={`w-full p-3 rounded-lg ${input}`}
                        placeholder="e.g., Jim Barksdale — Childhood (1943–1960)"
                        value={chapter}
                        onChange={(e) => setChapter(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: BRAND_COLOR }}>
                        Subject (Protagonist)
                      </label>
                      <input
                        className={`w-full p-3 rounded-lg ${input}`}
                        placeholder="e.g., Jim Barksdale"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: BRAND_COLOR }}>
                        Chapter Opening Style
                      </label>
                      <textarea
                        className={`w-full p-3 rounded-lg ${input}`}
                        rows={3}
                        placeholder="e.g., Open with a vivid, grounded scene from the start of the chapter's timeline. Capture the tension without revealing outcomes or skipping ahead."
                        value={openingStyle}
                        onChange={(e) => setOpeningStyle(e.target.value)}
                      />
                      <p className={`text-xs ${muted} mt-2 italic`}>
                        Decide how you want the chapter to start
                      </p>
                    </div>
                  </div>
                )}

                {tutorialStep === 2 && (
                  <div>
                    <div className="mb-4 p-4 rounded-lg border-2 border-amber-200 bg-amber-50">
                      <h4 className="text-sm font-bold mb-2" style={{ color: BRAND_COLOR, fontFamily: 'Playfair Display, Georgia, serif' }}>
                        Instructions for NotebookLM
                      </h4>
                      <ol className="text-xs space-y-1 list-decimal list-inside text-stone-700">
                        <li>Copy the prompt below using the copy button</li>
                        <li>Open your NotebookLM project with your research materials</li>
                        <li>Paste the prompt and submit it to NotebookLM</li>
                        <li>Copy the entire result and paste it in the text area below</li>
                      </ol>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-semibold mb-2" style={{ color: BRAND_COLOR }}>
                        Step 2A Prompt
                      </label>
                      <textarea
                        readOnly
                        className={`w-full p-3 rounded-lg ${input} text-xs mb-2`}
                        rows={4}
                        value={nbPrompt1}
                      />
                      <button 
                        onClick={() => copy(nbPrompt1)} 
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${btnSecondary}`}
                      >
                        Copy Prompt to Clipboard
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: BRAND_COLOR }}>
                        Paste NotebookLM Result Here
                      </label>
                      <textarea
                        className={`w-full p-3 rounded-lg ${input} text-sm`}
                        rows={3}
                        placeholder="Paste the complete result from NotebookLM here..."
                        value={nbOut1}
                        onChange={(e) => setNbOut1(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {tutorialStep === 3 && (
                  <div>
                    <div className="mb-4 p-4 rounded-lg border-2 border-amber-200 bg-amber-50">
                      <h4 className="text-sm font-bold mb-2" style={{ color: BRAND_COLOR, fontFamily: 'Playfair Display, Georgia, serif' }}>
                        Instructions for NotebookLM
                      </h4>
                      <ol className="text-xs space-y-1 list-decimal list-inside text-stone-700">
                        <li>Copy the prompt below using the copy button</li>
                        <li>Go back to the same NotebookLM session from Step 2A</li>
                        <li>Paste this new prompt and submit it</li>
                        <li>Copy the detailed result and paste it below</li>
                      </ol>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-semibold mb-2" style={{ color: BRAND_COLOR }}>
                        Step 2B Prompt
                      </label>
                      <textarea
                        readOnly
                        className={`w-full p-3 rounded-lg ${input} text-xs mb-2`}
                        rows={4}
                        value={nbPrompt2}
                      />
                      <button 
                        onClick={() => copy(nbPrompt2)} 
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${btnSecondary}`}
                      >
                        Copy Prompt to Clipboard
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: BRAND_COLOR }}>
                        Paste NotebookLM Result Here
                      </label>
                      <textarea
                        className={`w-full p-3 rounded-lg ${input} text-sm`}
                        rows={3}
                        placeholder="Paste the complete result from NotebookLM here..."
                        value={nbOut2}
                        onChange={(e) => setNbOut2(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {tutorialStep === 4 && (
                  <div>
                    <div className="mb-4 p-4 rounded-lg border-2 border-amber-200 bg-amber-50">
                      <h4 className="text-sm font-bold mb-2" style={{ color: BRAND_COLOR, fontFamily: 'Playfair Display, Georgia, serif' }}>
                        Instructions for NotebookLM
                      </h4>
                      <ol className="text-xs space-y-1 list-decimal list-inside text-stone-700">
                        <li>Copy the prompt below using the copy button</li>
                        <li>Continue in the same NotebookLM session from Step 2B</li>
                        <li>Paste this new prompt and submit it</li>
                        <li>Copy the narrative bridges result and paste it below</li>
                      </ol>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-semibold mb-2" style={{ color: BRAND_COLOR }}>
                        Step 2C Prompt
                      </label>
                      <textarea
                        readOnly
                        className={`w-full p-3 rounded-lg ${input} text-xs mb-2`}
                        rows={4}
                        value={nbPrompt3}
                      />
                      <button 
                        onClick={() => copy(nbPrompt3)} 
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${btnSecondary}`}
                      >
                        Copy Prompt to Clipboard
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: BRAND_COLOR }}>
                        Paste NotebookLM Result Here
                      </label>
                      <textarea
                        className={`w-full p-3 rounded-lg ${input} text-sm`}
                        rows={3}
                        placeholder="Paste the full Step 2C result from NotebookLM here…"
                        value={nbOut3}
                        onChange={(e) => setNbOut3(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {tutorialStep === 5 && (
                  <div>
                    <p className={`text-sm ${muted} mb-4`}>
                      The voice guide helps control the writing style. You can customize it or keep the default.
                    </p>
                    <textarea
                      className={`w-full p-3 rounded-lg ${input} text-sm`}
                      rows={8}
                      value={voiceGuide}
                      onChange={(e) => setVoiceGuide(e.target.value)}
                    />
                  </div>
                )}

                {tutorialStep === 6 && (
                  <div>
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold mb-2 text-green-800">
                        ✅ Ready to Generate!
                      </p>
                      <p className="text-sm text-green-700">
                        You've completed all the setup steps. Your chapter will be approximately 7,000 words and take several minutes to generate.
                      </p>
                    </div>
                    
                    {/* AI Model Selection in Tutorial */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold mb-2" style={{ color: BRAND_COLOR }}>
                        Select AI Model for Generation
                      </label>
                      <select
                        className={`w-full p-3 rounded-lg ${input}`}
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                      >
                        {availableModels.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name} ({model.provider}) - {(model.contextLength / 1000).toFixed(0)}K context
                          </option>
                        ))}
                      </select>
                      {selectedModelInfo && (
                        <p className={`text-xs ${muted} mt-2`}>
                          {selectedModelInfo.provider} • {(selectedModelInfo.contextLength / 1000).toFixed(0)}K context window
                        </p>
                      )}
                    </div>

                    <div className={`p-4 rounded-lg border ${border}`}>
                      <h4 className="font-semibold mb-2">Review Your Setup:</h4>
                      <ul className="text-sm space-y-1">
                        <li><strong>Chapter:</strong> {chapter || "Not specified"}</li>
                        <li><strong>Subject:</strong> {subject}</li>
                        <li><strong>Model:</strong> {selectedModelInfo?.name || "Not selected"}</li>
                        <li><strong>Step 2A:</strong> {nbOut1 ? "✅ Complete" : "❌ Missing"}</li>
                        <li><strong>Step 2B:</strong> {nbOut2 ? "✅ Complete" : "❌ Missing"}</li>
                        <li><strong>Step 2C:</strong> {nbOut3 ? "✅ Complete" : "❌ Missing"}</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Tutorial Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setTutorialStep(Math.max(1, tutorialStep - 1))}
                  disabled={tutorialStep === 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tutorialStep === 1 ? 'opacity-50 cursor-not-allowed' : btnSecondary
                  }`}
                >
                  Previous
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalTutorialSteps }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i + 1 === tutorialStep ? 'w-4' : ''
                      }`}
                      style={{ backgroundColor: i + 1 <= tutorialStep ? BRAND_COLOR : '#d6d3d1' }}
                    />
                  ))}
                </div>

                {tutorialStep < totalTutorialSteps ? (
                  <button
                    onClick={() => setTutorialStep(tutorialStep + 1)}
                    disabled={!currentTutorialStep.canProceed()}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all text-white border-2 focus:outline-none ${
                      currentTutorialStep.canProceed() 
                        ? 'shadow-lg hover:shadow-xl transform hover:scale-[1.02] border-transparent' 
                        : 'border-stone-300'
                    }`}
                    style={currentTutorialStep.canProceed() 
                      ? { backgroundColor: BRAND_COLOR } 
                      : { backgroundColor: isDark ? '#d6d3d1' : '#e7e5e4', color: isDark ? '#78716c' : '#44403c' }
                    }
                  >
                    {currentTutorialStep.canProceed() ? 'Next Step' : 'Complete Required Fields'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setTutorialMode(false);
                      setTab("generate");
                      if (currentTutorialStep.canProceed()) {
                        setTimeout(() => runAi(), 500);
                      }
                    }}
                    disabled={!currentTutorialStep.canProceed()}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all text-white border-2 focus:outline-none ${
                      currentTutorialStep.canProceed() 
                        ? 'shadow-lg hover:shadow-xl transform hover:scale-[1.02] border-transparent' 
                        : 'border-stone-300'
                    }`}
                    style={currentTutorialStep.canProceed() 
                      ? { backgroundColor: BRAND_COLOR } 
                      : { backgroundColor: '#d6d3d1', color: '#78716c' }
                    }
                  >
                    {currentTutorialStep.canProceed() ? 'Generate Chapter' : 'Complete Previous Steps'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {/* ===== TUTORIAL OVERLAY - END ===== */}

        {/* Helper Menu */}
        <div className="mb-8">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${btnSecondary} hover:scale-105`}
          >
            <span className={`transition-transform duration-500 ${showHelp ? 'rotate-180' : 'rotate-0'}`}>📖</span>
            <span style={{ fontFamily: 'Playfair Display, Georgia, serif' }} className="font-bold">
              Workflow Overview
            </span>
          </button>
          
          {showHelp && (
            <div className={`mt-6 rounded-lg ${panel} p-8 animate-in slide-in-from-top-2 duration-500`}>
              <h3 
                className="text-2xl font-bold mb-6"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', color: BRAND_COLOR }}
              >
                Complete Workflow
              </h3>
              
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300`}
                       style={{
                         background: `linear-gradient(135deg, ${BRAND_COLOR}, hsl(25, 60%, 40%))`,
                         color: 'white',
                         boxShadow: '0 4px 14px 0 rgba(180, 83, 9, 0.25)'
                       }}
                  >
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Configure Your Literary Project
                    </h4>
                    <p className={`text-sm ${muted} leading-relaxed`}>
                      Fill in your chapter title, subject, select your AI model, and upload your research materials to NotebookLM. Ensure all relevant documents, interviews, and sources are in your NotebookLM project for comprehensive biographical coverage.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300`}
                       style={{
                         background: `linear-gradient(135deg, ${BRAND_COLOR}, hsl(25, 60%, 40%))`,
                         color: 'white',
                         boxShadow: '0 4px 14px 0 rgba(180, 83, 9, 0.25)'
                       }}
                  >
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Execute NotebookLM Step 2A
                    </h4>
                    <p className={`text-sm ${muted} leading-relaxed`}>
                      Copy the "Step 2A" prompt and paste it into NotebookLM. This generates a contextual summary, chronological outline, and cast of characters. Return the comprehensive result here.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300`}
                       style={{
                         background: `linear-gradient(135deg, ${BRAND_COLOR}, hsl(25, 60%, 40%))`,
                         color: 'white',
                         boxShadow: '0 4px 14px 0 rgba(180, 83, 9, 0.25)'
                       }}
                  >
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Execute NotebookLM Step 2B
                    </h4>
                    <p className={`text-sm ${muted} leading-relaxed`}>
                      Copy the "Step 2B" prompt and paste it into NotebookLM. This gathers detailed evidence, quotes, and scenes for each chronological turning point. Return the comprehensive result here.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300`}
                       style={{
                         background: `linear-gradient(135deg, ${BRAND_COLOR}, hsl(25, 60%, 40%))`,
                         color: 'white',
                         boxShadow: '0 4px 14px 0 rgba(180, 83, 9, 0.25)'
                       }}
                  >
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Execute NotebookLM Step 2C
                    </h4>
                    <p className={`text-sm ${muted} leading-relaxed`}>
                      Copy the "Step 2C" prompt and paste it into NotebookLM. This creates narrative bridges that weave together the turning points into a coherent prose flow. Return the result here.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300`}
                       style={{
                         background: `linear-gradient(135deg, ${BRAND_COLOR}, hsl(25, 60%, 40%))`,
                         color: 'white',
                         boxShadow: '0 4px 14px 0 rgba(180, 83, 9, 0.25)'
                       }}
                  >
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Generate Your Literary Chapter
                    </h4>
                    <p className={`text-sm ${muted} leading-relaxed`}>
                      Once all three NotebookLM outputs are integrated, initiate the generation of a complete ~7,000-word biographical chapter in Walter Isaacson's distinguished literary style using your selected AI model.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`mt-8 p-6 rounded-lg border transition-all duration-300`}
                   style={{
                     background: isDark ? 'rgba(180, 83, 9, 0.1)' : 'rgba(180, 83, 9, 0.05)',
                     borderColor: isDark ? 'rgba(180, 83, 9, 0.3)' : 'rgba(180, 83, 9, 0.2)'
                   }}
              >
                <h4 className={`font-bold mb-3`} style={{ 
                  fontFamily: 'Playfair Display, Georgia, serif',
                  color: BRAND_COLOR
                }}>
                  ✒️ Master Craftsman Tips
                </h4>
                <ul className={`text-sm leading-relaxed space-y-2`} style={{ color: isDark ? '#d6d3d1' : '#57534e' }}>
                  <li>• Ensure your NotebookLM project contains all relevant source materials before beginning</li>
                  <li>• Chapter titles should be precise and evocative (e.g., "Jim Barksdale — Joining Netscape (1994-1995)")</li>
                  <li>• The richness of your Step 2B output directly correlates to the depth of your final chapter</li>
                  <li>• Step 2C helps create smooth narrative flow between key events</li>
                  <li>• Customize the Voice Guide to align with your preferred biographical narrative style</li>
                  <li>• Choose the AI model that best fits your needs - consider context length and capabilities</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced tabs */}
        <div className="flex gap-4 mb-10">
          <button
            onClick={() => setTab("prep")}
            className="px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg transform hover:scale-[1.02] focus:outline-none"
            style={{ 
              fontFamily: 'Inter, sans-serif',
              backgroundColor: tab === "prep" ? BRAND_COLOR : (isDark ? '#57534e' : 'white'),
              color: tab === "prep" ? 'white' : (isDark ? '#e7e5e4' : '#44403c'),
              border: tab !== "prep" ? (isDark ? '1px solid #78716c' : '2px solid #e7e5e4') : 'none',
              boxShadow: tab === "prep" ? '0 8px 25px rgba(180, 83, 9, 0.25)' : 'none'
            }}
          >
            Setup & Research
          </button>
          <button
            onClick={() => setTab("generate")}
            className="px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg transform hover:scale-[1.02] focus:outline-none"
            style={{ 
              fontFamily: 'Inter, sans-serif',
              backgroundColor: tab === "generate" ? BRAND_COLOR : (isDark ? '#57534e' : 'white'),
              color: tab === "generate" ? 'white' : (isDark ? '#e7e5e4' : '#44403c'),
              border: tab !== "generate" ? (isDark ? '1px solid #78716c' : '2px solid #e7e5e4') : 'none',
              boxShadow: tab === "generate" ? '0 8px 25px rgba(180, 83, 9, 0.25)' : 'none'
            }}
          >
            Generate Chapter
          </button>
        </div>

        {tab === "prep" && (
          <>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left column - Configuration */}
              <div className={`rounded-lg ${panel} p-8`}>
                <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: BRAND_COLOR }}>
                  Step 1: Configuration
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-semibold ${subtle} mb-3`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Knowledge Base
                    </label>
                    <select
                      className={`w-full p-4 rounded-lg ${input} transition-all appearance-none bg-no-repeat bg-right pr-12 font-medium`}
                      style={{
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${isDark ? '%23a8a29e' : '%23525252'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 1rem center',
                        backgroundSize: '1.25em 1.25em'
                      }}
                      value={kb}
                      onChange={(e) => setKb(e.target.value)}
                    >
                      <option value="All Research Materials">All Research Materials</option>
                      <option value="Interview Transcripts">Interview Transcripts</option>
                      <option value="Books/Media">Books/Media</option>
                      <option value="Web Articles">Web Articles</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${subtle} mb-3`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Chapter Title <span style={{ color: BRAND_COLOR }}>*</span>
                    </label>
                    <input
                      className={`w-full p-4 rounded-lg ${input} transition-all font-medium`}
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      placeholder="e.g., Jim Barksdale — Childhood (1943–1960) | Joining Netscape (1994–1995)"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                    />
                    <p className={`text-xs ${muted} mt-2 italic`}>
                      Required for ASSIGNMENT section and source materials
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${subtle} mb-3`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Subject (Protagonist)
                    </label>
                    <input
                      className={`w-full p-4 rounded-lg ${input} transition-all font-medium`}
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      placeholder="e.g., Jim Barksdale"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${subtle} mb-3`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Chapter Opening Style
                    </label>
                    <textarea
                      className={`w-full p-4 rounded-lg ${input} transition-all font-medium`}
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      rows={3}
                      placeholder="e.g., Open with a vivid, grounded scene from the start of the chapter's timeline. Capture the tension without revealing outcomes or skipping ahead."
                      value={openingStyle}
                      onChange={(e) => setOpeningStyle(e.target.value)}
                    />
                    <p className={`text-xs ${muted} mt-2 italic`}>
                      Decide how you want the chapter to start (e.g., "Open with a vivid, grounded scene from the start of the chapter's timeline. Capture the tension without revealing outcomes or skipping ahead.")
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${subtle} mb-3`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Research Goal
                    </label>
                    <input
                      className={`w-full p-4 rounded-lg ${input} transition-all font-medium`}
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${subtle} mb-3`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Context Notes (Optional)
                      </label>
                    <textarea
                      className={`w-full p-4 rounded-lg ${input} transition-all font-medium`}
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      rows={4}
                      placeholder="Additional context or specific requirements. An example would be the end of the previous chapter or key themes to focus on..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div> 
                
                <div className={`border-t pt-8 mt-10`} style={{ borderColor: isDark ? 'rgba(168, 162, 158, 0.2)' : 'rgba(120, 113, 108, 0.2)' }}>
                  <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: BRAND_COLOR }}>
                    Literary Voice
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className={`block text-sm font-semibold ${subtle} mb-3`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                        Voice Guide
                      </label>
                      <p className={`text-sm ${muted} mb-3 italic`}>
                        Controls the writing style. We recommend keeping the default, but you can customize if needed.
                      </p>
                      <textarea
                        className={`w-full p-4 rounded-lg ${input} text-sm transition-all`}
                        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                        rows={12}
                        value={voiceGuide}
                        onChange={(e) => setVoiceGuide(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold ${subtle} mb-3`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                        Style Exemplar (Optional)
                      </label>
                      <p className={`text-sm ${muted} mb-3 italic`}>
                        Sample text for AI reference
                      </p>
                      <textarea
                        className={`w-full p-4 rounded-lg ${input} text-sm transition-all`}
                        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                        rows={16}
                        placeholder="Paste a short style sample you can reference (can be deleted later)..."
                        value={voiceExemplar}
                        onChange={(e) => setVoiceExemplar(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column - NotebookLM Integration */}
              <div className={`rounded-lg ${panel} p-8`}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: BRAND_COLOR }}>
                    Step 2: NotebookLM Integration
                  </h2>
                  <a 
                    href="https://notebooklm.google/" 
                    target="_blank" 
                    rel="noreferrer" 
                    className={`text-sm font-medium transition-all duration-200 hover:opacity-70 focus:outline-none whitespace-nowrap`}
                    style={{ color: BRAND_COLOR, textDecoration: 'underline' }}
                  >
                    NotebookLM ↗
                  </a>
                </div>

                <div className="space-y-8">
                  <div>
                    <div className="mb-4">
                      <h3 className={`text-base font-bold ${subtle}`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                        Step 2A: Context & Chronology
                      </h3>
                      <p className={`text-sm ${muted} mt-1 italic`}>Open your NotebookLM project with research materials and paste this prompt</p>
                    </div>
                    <textarea
                      readOnly
                      className={`w-full p-4 rounded-lg ${input} text-sm`}
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      rows={8}
                      value={nbPrompt1}
                    />
                    <button 
                      onClick={() => copy(nbPrompt1)} 
                      className={`mt-4 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${btnSecondary}`}
                    >
                      Copy Step 2A Prompt
                    </button>
                  </div>

                  <div>
                    <div className="mb-4">
                      <h3 className={`text-base font-bold ${subtle}`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                        Step 2B: Detailed Evidence
                      </h3>
                      <p className={`text-sm ${muted} mt-1 italic`}>Continue in the same NotebookLM session and paste this second prompt</p>
                    </div>
                    <textarea
                      readOnly
                      className={`w-full p-4 rounded-lg ${input} text-sm`}
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      rows={8}
                      value={nbPrompt2}
                    />
                    <button 
                      onClick={() => copy(nbPrompt2)} 
                      className={`mt-4 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${btnSecondary}`}
                    >
                      Copy Step 2B Prompt
                    </button>
                  </div>

                  <div>
                    <div className="mb-4">
                      <h3 className={`text-base font-bold ${subtle}`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                        Step 2C: Narrative Bridges
                      </h3>
                      <p className={`text-sm ${muted} mt-1 italic`}>Continue in the same NotebookLM session with this third prompt</p>
                    </div>
                    <textarea
                      readOnly
                      className={`w-full p-4 rounded-lg ${input} text-sm`}
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      rows={8}
                      value={nbPrompt3}
                    />
                    <button 
                      onClick={() => copy(nbPrompt3)} 
                      className={`mt-4 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${btnSecondary}`}
                    >
                      Copy Step 2C Prompt
                    </button>
                  </div>

                  <div className={`border-t pt-8`} style={{ borderColor: isDark ? 'rgba(168, 162, 158, 0.2)' : 'rgba(120, 113, 108, 0.2)' }}>
                    <h3 className={`text-base font-bold ${subtle} mb-4`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Paste NotebookLM Results
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className={`block text-sm font-semibold ${muted} mb-3`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                          Step 2A Output ({nb1Counts.words.toLocaleString()} words)
                        </label>
                        <textarea
                          className={`w-full p-4 rounded-lg ${input} text-sm`}
                          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                          rows={6}
                          placeholder="Paste the full Step 2A result from NotebookLM here..."
                          value={nbOut1}
                          onChange={(e) => setNbOut1(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-semibold ${muted} mb-3`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                          Step 2B Output ({nb2Counts.words.toLocaleString()} words)
                        </label>
                        <textarea
                          className={`w-full p-4 rounded-lg ${input} text-sm`}
                          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                          rows={8}
                          placeholder="Paste the full Step 2B result from NotebookLM here..."
                          value={nbOut2}
                          onChange={(e) => setNbOut2(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-semibold ${muted} mb-3`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                          Step 2C Output ({nb3Counts.words.toLocaleString()} words)
                        </label>
                        <textarea
                          className={`w-full p-4 rounded-lg ${input} text-sm`}
                          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                          rows={6}
                          placeholder="Paste the full Step 2C result from NotebookLM here..."
                          value={nbOut3}
                          onChange={(e) => setNbOut3(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assembled prompt section */}
            <div className={`mt-10 rounded-lg ${panel} p-8`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: BRAND_COLOR }}>
              Step 3: Final Assembly
            </h2>
              <p className={`text-sm ${muted} mt-2 italic`}>Configure AI model and review complete prompt</p>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <button 
      onClick={() => copy(assembledAiPrompt)} 
      className={`text-sm font-medium transition-all duration-200 hover:opacity-70 focus:outline-none whitespace-nowrap shrink-0`}
      style={{ color: BRAND_COLOR }}
    >
      Copy Full Prompt
                  </button>
                  <button
                    onClick={runAndOpenGenerateTab}
                    className="px-6 py-3 rounded-lg text-base font-semibold transition-all duration-300 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                    style={{ 
                      fontFamily: 'Playfair Display, Georgia, serif',
                      backgroundColor: BRAND_COLOR,
                      boxShadow: (!chapter.trim() || !startsWithRole || !hasTaskLine) ? 'none' : 
                        '0 8px 25px rgba(180, 83, 9, 0.25)'
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = 'hsl(35, 70%, 40%)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = BRAND_COLOR;
                      }
                    }}
                    disabled={!chapter.trim() || !startsWithRole || !hasTaskLine}
                  >
                    Generate Chapter →
                  </button>
                </div>
              </div>
              
              {/* AI Model Selection - PROMINENTLY DISPLAYED */}
              <div className={`mb-6 p-5 rounded-lg border-2 ${isDark ? 'bg-stone-800/50 border-amber-500/30' : 'bg-amber-50 border-amber-300'}`}>
                <label className={`block text-sm font-bold mb-3`} style={{ fontFamily: 'Playfair Display, Georgia, serif', color: BRAND_COLOR }}>
                  Select AI Model for Generation
                </label>
                <div className="relative">
                  <select
                    className={`w-full p-4 rounded-lg ${input} transition-all appearance-none bg-no-repeat bg-right pr-12 font-medium`}
                    style={{
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${isDark ? '%23a8a29e' : '%23525252'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '1.25em 1.25em'
                    }}
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {availableModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.provider}) - {(model.contextLength / 1000).toFixed(0)}K context
                      </option>
                    ))}
                  </select>
                </div>
                {selectedModelInfo && (
                  <p className={`text-xs ${muted} mt-2 italic`}>
                    {selectedModelInfo.provider} • {(selectedModelInfo.contextLength / 1000).toFixed(0)}K context window • Ready to generate with {selectedModelInfo.name}
                  </p>
                )}
              </div>

              <textarea
                readOnly
                className={`w-full p-6 rounded-lg ${input} text-sm leading-relaxed`}
                style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                rows={18}
                value={assembledAiPrompt}
              />
              
              <div className="flex items-center justify-between mt-6">
                <div className={`text-sm ${muted} font-medium`}>
                  {counts.words.toLocaleString()} words • {counts.chars.toLocaleString()} characters
                </div>
                {status && (
                  <div className="text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-300" 
                       style={{ 
                         background: isDark ? 'rgba(180, 83, 9, 0.15)' : 'rgba(180, 83, 9, 0.05)',
                         color: BRAND_COLOR,
                         border: '1px solid rgba(180, 83, 9, 0.2)'
                       }}
                  >
                    {status}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tab === "generate" && (
          <div className={`rounded-lg ${panel} p-8`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black mb-2" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: BRAND_COLOR }}>
                  Step 4: Chapter Generation
                </h2>
                {chapter && (
                  <h3 className={`text-xl font-bold ${subtle} mt-2 italic`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                    {chapter}
                  </h3>
                )}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4">
                  <p className={`text-sm ${muted} font-medium`}>Using {selectedModelInfo?.name || 'Selected AI Model'}</p>
                  {loadingAi && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                      <span className={`text-sm ${subtle} font-medium`}>
                        {generationStats.wordsPerMinute > 0 && `${generationStats.wordsPerMinute} WPM • `}
                        {generationStats.estimatedCompletion}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto sm:justify-end">
  <button 
    onClick={() => setTab("prep")} 
    className={`text-sm font-medium underline transition-all duration-200 hover:opacity-70 focus:outline-none shrink-0`}
    style={{ color: BRAND_COLOR, textDecoration: 'underline' }}
  >
    ← Back to Preparation
  </button>
  {!loadingAi ? (
    <button 
      onClick={runAi} 
      className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${btnSecondary} shrink-0`}
    >
      Re-run Generation
    </button>
  ) : (
    <button 
      onClick={stopAi} 
      className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-300 text-white focus:outline-none shrink-0`}
      style={{ 
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        boxShadow: '0 4px 14px 0 rgba(220, 38, 38, 0.25)'
      }}
    >
      Stop Generation
    </button>
  )}
</div>
            </div>
            
            {aiError && (
              <div className="mb-6 p-6 rounded-lg border transition-all duration-300"
                   style={{
                     background: isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                     borderColor: isDark ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)'
                   }}
              >
                <div className={`text-sm font-medium`} style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>
                  {aiError}
                </div>
              </div>
            )}

            {/* Enhanced output display */}
            <div 
            ref={outputRef}
             data-output-panel="true"
              className={`w-full p-8 rounded-lg ${input} text-sm leading-relaxed overflow-y-auto transition-all duration-500`}
              style={{ 
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                minHeight: '500px',
                maxHeight: loadingAi ? '700px' : '600px',
                transition: 'max-height 0.5s ease-in-out'
              }}
            >
              {loadingAi && !displayedOutput ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-stone-200 rounded-full animate-spin mx-auto mb-6"
                         style={{
                           borderTopColor: BRAND_COLOR,
                           borderRightColor: BRAND_COLOR
                         }}
                    ></div>
                    <h3 className={`text-base font-bold ${subtle} mb-2`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Crafting your literary chapter...
                    </h3>
                    <p className={`text-sm ${muted} italic`}>This may take several minutes for a comprehensive 4,000-7,000 word response.</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-stone max-w-none whitespace-pre-wrap" style={{ color: isDark ? '#e7e5e4' : '#1c1917' }}>
                  {displayedOutput}
                  {loadingAi && displayedOutput && (
                    <span className="inline-block w-2 h-6 animate-pulse ml-1" style={{ backgroundColor: BRAND_COLOR }}></span>
                  )}
                </div>
              )}
            </div>
            
            {/* Stats and export bar */}
            <div className="flex items-center justify-between mt-6 pt-6" style={{ borderTop: '1px solid ' + (isDark ? 'rgba(168, 162, 158, 0.2)' : 'rgba(120, 113, 108, 0.2)') }}>
              <div className={`text-sm ${muted} space-x-6 font-medium`}>
                <span>{aiCounts.words.toLocaleString()} words</span>
                <span>{aiCounts.chars.toLocaleString()} characters</span>
                <span>{Math.round(aiCounts.words / 250)} min read</span>
                {loadingAi && generationStats.wordsPerMinute > 0 && (
                  <span className="font-semibold" style={{ color: BRAND_COLOR }}>
                    {((aiCounts.words / 7000) * 100).toFixed(1)}% complete
                  </span>
                )}
              </div>
              {aiOutput && !loadingAi && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => copy(aiOutput)} 
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${btnSecondary}`}
                  >
                    Copy Text
                  </button>
                  <button 
                    onClick={exportAsText} 
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 text-white focus:outline-none"
                    style={{ backgroundColor: BRAND_COLOR }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'hsl(35, 70%, 40%)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = BRAND_COLOR;
                    }}
                  >
                    Download .txt
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 👇 Add this here, before the final closing </div> */}
      <style jsx global>{`
        @media (max-width: 640px) {
          .boswell-root .px-6 { padding-left: 1rem !important; padding-right: 1rem !important; }
          .boswell-root .px-8 { padding-left: 1rem !important; padding-right: 1rem !important; }
          .boswell-root .py-8 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
          .boswell-root .p-8  { padding: 1rem !important; }
          .boswell-root .py-4 { padding-top: .75rem !important; padding-bottom: .75rem !important; }
          .boswell-root .p-6  { padding: 1rem !important; }

          .boswell-root .sticky.top-0 .mx-auto > .flex {
            flex-direction: column !important;
            gap: .75rem !important;
            align-items: stretch !important;
          }
          .boswell-root .sticky.top-0 .mx-auto > .flex > div:last-child {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            gap: .5rem !important;
          }
          .boswell-root .sticky.top-0 button {
            width: 100% !important;
            font-size: .875rem !important;
            padding: .5rem .75rem !important;
          }

          .boswell-root svg.w-8.h-8 { width: 2.5rem !important; height: 2.5rem !important; stroke-width: 2 !important; }
          .boswell-root h1.text-4xl { font-size: 1.5rem !important; line-height: 2rem !important; }

          .boswell-root .flex.gap-4.mb-10 {
            flex-direction: column !important;
          }
          .boswell-root .flex.gap-4.mb-10 > button {
            width: 100% !important;
            white-space: nowrap !important;
            font-size: .875rem !important;
            padding: .75rem 1rem !important;
          }

          .boswell-root .rounded-lg.p-8,
          .boswell-root .rounded-xl.p-8 {
            padding: 1rem !important;
          }

          .boswell-root textarea,
          .boswell-root input[type="text"],
          .boswell-root input[type="password"] {
            font-size: .9rem !important;
            padding: .75rem !important;
          }

          .boswell-root [data-output-panel="true"] {
            min-height: 360px !important;
            max-height: 520px !important;
          }

          .boswell-root button { white-space: nowrap !important; }
        }
      `}</style>
    </div>
  );
}