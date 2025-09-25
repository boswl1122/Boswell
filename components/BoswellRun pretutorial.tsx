import React, { useEffect, useMemo, useRef, useState } from "react";
import { Feather } from "lucide-react";

export default function BoswellRun() {
type Tab = "prep" | "claude";
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

// Voice guide / exemplar
const [voiceGuide, setVoiceGuide] = useState(`Voice Guide
- Open with a vivid, grounded scene tied to the chapter's tension.
- After the opener: strict chronology (no time-jumps/flashbacks).
- Balance scene and exposition; include concrete physical detail.
- Quotes: introduce speaker + circumstance; group quotes to build an idea.
- MINIMUM 8-12 sentences per paragraph (this is non-negotiable)
- Prefer commas/periods over em dashes; steady, explanatory tone.
- Every detail must advance the narrative or reveal character.
- End with a concrete scene or single sharp observation
- NO summarizing themes or lessons learned
- NO heavy-handed foreshadowing about future success
- NO philosophical reflections - just stop when the chronology ends
- Maximum ONE short concluding paragraph if needed
- When someone new appears, briefly establish who they are in relation to the protagonist
- Let scenes carry meaning without explaining them`);

const [voiceExemplar, setVoiceExemplar] = useState(`[Excerpt: Aspen, Christmas 1994]
With the kids gathered around a beige desktop in the rental house, Barksdale typed a case number and watched the browser fetch a court decision in seconds. "Wow, how did it do that?" Susan asked. Betsy leaned in next; a lesson plan appeared as quickly as if it were on the hard drive. David wanted concert dates; a fan site listed a New Orleans show the next April. "It is not in the machine," Barksdale said. "All I have is a browser and a network." Newspapers from Tokyo and London, a virtual walk through the Louvre—the room filled with the sense that something fundamental had shifted. By the end of the night, what had seemed reckless began to feel inevitable.`);

// ----- NotebookLM outputs -----
const [nbOut1, setNbOut1] = useState(""); // Step 2A
const [nbOut2, setNbOut2] = useState(""); // Step 2B

// ----- Claude API state -----
const [claudeOutput, setClaudeOutput] = useState("");
const [displayedOutput, setDisplayedOutput] = useState("");
const [loadingClaude, setLoadingClaude] = useState(false);
const [claudeError, setClaudeError] = useState<string | null>(null);
const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);
const [generationStats, setGenerationStats] = useState({
  wordsPerMinute: 0,
  startTime: 0,
  estimatedCompletion: "",
});

// UI feedback
const [status, setStatus] = useState<string | null>(null);
const [showHelp, setShowHelp] = useState(false);

// Simple text display - no streaming animation for now
useEffect(() => {
  setDisplayedOutput(claudeOutput);
}, [claudeOutput]);

// Auto-scroll Claude output with smooth animation
const claudeRef = useRef<HTMLTextAreaElement | null>(null);
const outputRef = useRef<HTMLDivElement | null>(null);
useEffect(() => {
  if (outputRef.current) {
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }
}, [displayedOutput]);

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
    `\nBOSWELL RUN — STEP 2A (NotebookLM - Context + Chronology + People)
Knowledge Base: ${kb}
Chapter: ${chapter || "(unspecified)"}
Main Subject: ${subject || "(unspecified)"}
Goal: ${goal}
Context notes (optional):
${notes || "(none)"}

Please produce:
1) One-paragraph context summary of all material relevant to this chapter focus.

2) Chronological outline of major turning points (with estimated dates/ages).
 - Use numbered entries.
 - Include age/date if possible.
 - Keep entries short (1–2 sentences).

3) People & Roles — Cast of Characters relevant to this chapter.
 - For each person: Name; one-line role/identity; relationship to ${subject || "the main subject"}; first appearance (approx date/age if known); why they matter in this chapter (1 line).
 - Group by proximity tier if obvious (e.g., family, colleagues, investors, friends, antagonists).
 - Keep each entry to 1–2 lines.
 - Do NOT repeat full quotes here; save quotes for Step 2B.

Output as clearly labeled sections.
`,
  [kb, chapter, goal, notes, subject]
);

const nbPrompt2 = useMemo(
  () =>
    `\nBOSWELL RUN — STEP 2B (NotebookLM - Detailed Evidence + People per Event)
Knowledge Base: ${kb}
Chapter: ${chapter || "(unspecified)"}
Main Subject: ${subject || "(unspecified)"}
Goal: ${goal}
Context notes (optional):
${notes || "(none)"}

Please produce:
1) Expanded report for each chronological turning point (matching Step 2A numbering).
 - Brief recap of the event (1–2 sentences).
 - People Involved: list the key people present or influential; for each include role/relationship to ${subject || "the main subject"} (1 line).
 - Sub-bullets with ALL relevant quotes.
   • Identify who said each quote, with source citation and estimated timing (e.g., "late 1994, age ~51").
   • If paraphrasing is stronger than quoting, do both (short quote + 1–2 sentence paraphrase).
 - Key scenes if identifiable (characters, setting, source).

2) Bibliography of all sources used (primary vs secondary).
 - Provide full citations and map them to the events/quotes above (e.g., [TP-3] → Source A, Source B).

Output as clearly labeled sections.
`,
  [kb, chapter, goal, notes, subject]
);

const claudeSystemHeader = useMemo(
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
 - Begin with a vivid, cinematic scene that captures the chapter's central tension.
 - Ground time, place, characters, and stakes immediately.
2) STRUCTURE
 - After the opener, maintain strict chronological order. No flashbacks or "meanwhile" jumps.
 - Weave background context into the flow (avoid frequent subheads).
3) PROSE & STYLE
 - Measured, explanatory tone for intelligent general readers.
 - Longer paragraphs (8–12 sentences) with varied sentence length.
 - Prefer commas/periods over em-dashes; avoid business-book clichés.
4) QUOTES
 - Introduce speaker + circumstance, then quote.
 - Group related quotes to build insight; paraphrase when exact words aren't essential.
 - Keep NB-LM estimated timing explicit when relevant (e.g., "late 1994, age ~51").
5) THEMATIC DISCIPLINE
 - Every scene must advance the narrative or reveal character. Cut tangents.
6) LENGTH
 - Write ~7,000 words of polished narrative. Develop scenes fully.
 - If underpowered near the end, deepen scenes/quotes/analysis before concluding.

AVOID
- Generic business jargon; excessive subheads; time jumps; editorializing beyond sources.

OUTPUT
- A single continuous narrative chapter (~7,000 words).
- End with a short "Editor's Notes" (gaps/fact-check list) and a brief bibliography pointer to NB-LM citations.

SOURCE MATERIALS FOLLOW
[VOICE GUIDE]`,
  [kb, chapter, goal, subject]
);

const assembledClaudePrompt = useMemo(() => {
  const parts: string[] = [];
  parts.push(claudeSystemHeader);
  parts.push(voiceGuide.trim());
  if (voiceExemplar.trim()) parts.push("\n[STYLE EXEMPLAR — tone only]\n" + voiceExemplar.trim());
  parts.push("\n[NOTEBOOKLM OUTPUT — STEP 2A]\n" + (nbOut1.trim() || "(paste Step 2A here)"));
  parts.push("\n[NOTEBOOKLM OUTPUT — STEP 2B]\n" + (nbOut2.trim() || "(paste Step 2B here)"));
  parts.push(`\nFINAL INSTRUCTION\n- CRITICAL: Do not stop until you've produced ~7,000 words. If you approach the end short of this, expand scenes and quotes before concluding.`);
  return parts.join("\n\n");
}, [claudeSystemHeader, voiceGuide, voiceExemplar, nbOut1, nbOut2]);

const startsWithRole = assembledClaudePrompt.trimStart().toLowerCase().startsWith("you are writing");
const hasTaskLine = assembledClaudePrompt.includes("ASSIGNMENT");

// ----- Streaming helpers -----
async function streamOnce(body: Record<string, any>, onChunk: (t: string) => void, signal: AbortSignal) {
  const res = await fetch("/api/claude", {
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

async function runClaude() {
  setClaudeError(null);
  setLoadingClaude(true);
  setClaudeOutput("");
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
    await streamOnce(
      {
        prompt: assembledClaudePrompt,
        maxTokens: 28000,
      },
      (chunk) => {
        setClaudeOutput((prev) => {
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
    if (e?.name === "AbortError") setClaudeError("Stopped by user");
    else setClaudeError(e?.message || "Stream failed");
  } finally {
    setLoadingClaude(false);
    setAbortCtrl(null);
  }
}

function stopClaude() {
  if (abortCtrl) {
    abortCtrl.abort();
    setAbortCtrl(null);
    setLoadingClaude(false);
  }
}

function runAndOpenClaudeTab() {
  if (!chapter.trim()) {
    setStatus("Add a Chapter first — it feeds the ASSIGNMENT line");
    return;
  }
  setTab("claude");
  setTimeout(() => runClaude(), 80);
}

// Export functions
const exportAsText = () => {
  const blob = new Blob([claudeOutput], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${chapter || 'chapter'}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

const copyFormattedOutput = async () => {
  const formatted = `# ${chapter || 'Biography Chapter'}\n\n${claudeOutput}`;
  await copy(formatted);
};

const counts = useMemo(() => {
  const text = assembledClaudePrompt || "";
  const words = (text.match(/\b\w+\b/g) || []).length;
  return { chars: text.length, words };
}, [assembledClaudePrompt]);

const nb1Counts = useMemo(
  () => ({ words: (nbOut1.match(/\b\w+\b/g) || []).length, chars: nbOut1.length }),
  [nbOut1]
);
const nb2Counts = useMemo(
  () => ({ words: (nbOut2.match(/\b\w+\b/g) || []).length, chars: nbOut2.length }),
  [nbOut2]
);
const claudeCounts = useMemo(
  () => ({ words: (claudeOutput.match(/\b\w+\b/g) || []).length, chars: claudeOutput.length }),
  [claudeOutput]
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
  ? "bg-stone-800/80 hover:bg-stone-700/80 border border-stone-600/50 text-stone-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300" 
  : "bg-white hover:bg-stone-50 border-2 border-stone-300 hover:border-stone-800 text-stone-700 hover:text-stone-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300";

return (
  <div className={`min-h-screen ${pageBg}`} style={{
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    ...pageStyle
  }}>
    {/* Enhanced sticky header */}
    <div className={`sticky top-0 z-30 ${headerBg} border-b ${border} shadow-sm`}>
      <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Boswell logo */}
          <Feather 
            className="w-8 h-8" 
            strokeWidth={1.5}
            style={{ color: BRAND_COLOR }}
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
      {/* Helper Menu */}
      <div className="mb-8">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${btnSecondary} hover:scale-105`}
        >
          <span className={`transition-transform duration-500 ${showHelp ? 'rotate-180' : 'rotate-0'}`}>📖</span>
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif' }} className="font-bold">
            Literary Workflow Guide
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
                    Fill in your chapter title, subject, and upload your research materials to NotebookLM. Ensure all relevant documents, interviews, and sources are in your NotebookLM project for comprehensive biographical coverage.
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
                    Generate Your Literary Chapter
                  </h4>
                  <p className={`text-sm ${muted} leading-relaxed`}>
                    Once both NotebookLM outputs are integrated, initiate the generation of a complete ~7,000-word biographical chapter in Walter Isaacson's distinguished literary style.
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
                <li>• Customize the Voice Guide to align with your preferred biographical narrative style</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced tabs */}
      <div className="flex gap-4 mb-10">
        <button
          onClick={() => setTab("prep")}
          className="px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg transform hover:scale-[1.02]"
          style={{ 
            fontFamily: tab === "prep" ? 'Playfair Display, Georgia, serif' : 'Inter, sans-serif',
            backgroundColor: tab === "prep" ? BRAND_COLOR : (isDark ? '#57534e' : 'white'),
            color: tab === "prep" ? 'white' : (isDark ? '#e7e5e4' : '#44403c'),
            border: tab !== "prep" ? (isDark ? '1px solid #78716c' : '2px solid #e7e5e4') : 'none',
            boxShadow: tab === "prep" ? '0 8px 25px rgba(180, 83, 9, 0.25)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (tab === "prep") {
              e.currentTarget.style.backgroundColor = 'hsl(35, 70%, 40%)';
            }
          }}
          onMouseLeave={(e) => {
            if (tab === "prep") {
              e.currentTarget.style.backgroundColor = BRAND_COLOR;
            }
          }}
        >
          Setup & Research
        </button>
        <button
          onClick={() => setTab("claude")}
          className="px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg transform hover:scale-[1.02]"
          style={{ 
            fontFamily: tab === "claude" ? 'Playfair Display, Georgia, serif' : 'Inter, sans-serif',
            backgroundColor: tab === "claude" ? BRAND_COLOR : (isDark ? '#57534e' : 'white'),
            color: tab === "claude" ? 'white' : (isDark ? '#e7e5e4' : '#44403c'),
            border: tab !== "claude" ? (isDark ? '1px solid #78716c' : '2px solid #e7e5e4') : 'none',
            boxShadow: tab === "claude" ? '0 8px 25px rgba(180, 83, 9, 0.25)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (tab === "claude") {
              e.currentTarget.style.backgroundColor = 'hsl(35, 70%, 40%)';
            }
          }}
          onMouseLeave={(e) => {
            if (tab === "claude") {
              e.currentTarget.style.backgroundColor = BRAND_COLOR;
            }
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
                    placeholder="Additional context or specific requirements..."
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
                      rows={8}
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
                  className="text-sm underline font-semibold transition-all duration-300 hover:scale-105"
                  style={{ color: BRAND_COLOR }}
                >
                  Open NotebookLM ↗
                </a>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="mb-4">
                    <h3 className={`text-base font-bold ${subtle}`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      Step 2A: Context & Chronology
                    </h3>
                    <p className={`text-sm ${muted} mt-1 italic`}>Research prompt for NotebookLM</p>
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
                    <p className={`text-sm ${muted} mt-1 italic`}>Evidence gathering prompt for NotebookLM</p>
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
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assembled prompt section */}
          <div className={`mt-10 rounded-lg ${panel} p-8`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: BRAND_COLOR }}>
                  Step 3: Final Assembly
                </h2>
                <p className={`text-sm ${muted} mt-2 italic`}>Complete prompt ready for Claude API</p>
              </div>
              <div className="flex gap-4 items-center">
                <button 
                  onClick={() => copy(assembledClaudePrompt)} 
                  className="text-sm underline font-semibold transition-all duration-300 hover:scale-105"
                  style={{ color: BRAND_COLOR }}
                >
                  Copy Full Prompt
                </button>
                <button
                  onClick={runAndOpenClaudeTab}
                  className="px-6 py-3 rounded-lg text-base font-semibold transition-all duration-300 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            
            <textarea
              readOnly
              className={`w-full p-6 rounded-lg ${input} text-sm leading-relaxed`}
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              rows={18}
              value={assembledClaudePrompt}
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

      {tab === "claude" && (
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
              <div className="flex items-center gap-6 mt-4">
                <p className={`text-sm ${muted} font-medium`}>Using Claude 4.1 Opus</p>
                {loadingClaude && (
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
            <div className="flex gap-4">
              <button 
                onClick={() => setTab("prep")} 
                className="text-sm underline font-semibold transition-all duration-300 hover:scale-105"
                style={{ color: BRAND_COLOR }}
              >
                ← Back to Preparation
              </button>
              {!loadingClaude ? (
                <button 
                  onClick={runClaude} 
                  className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${btnSecondary}`}
                >
                  Re-run Generation
                </button>
              ) : (
                <button 
                  onClick={stopClaude} 
                  className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-300 text-white`}
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
          
          {claudeError && (
            <div className="mb-6 p-6 rounded-lg border transition-all duration-300"
                 style={{
                   background: isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                   borderColor: isDark ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)'
                 }}
            >
              <div className={`text-sm font-medium`} style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>
                {claudeError}
              </div>
            </div>
          )}

          {/* Enhanced output display */}
          <div 
            ref={outputRef}
            className={`w-full p-8 rounded-lg ${input} text-sm leading-relaxed overflow-y-auto transition-all duration-500`}
            style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              minHeight: '500px',
              maxHeight: loadingClaude ? '700px' : '600px',
              transition: 'max-height 0.5s ease-in-out'
            }}
          >
            {loadingClaude && !displayedOutput ? (
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
                {loadingClaude && displayedOutput && (
                  <span className="inline-block w-2 h-6 animate-pulse ml-1" style={{ backgroundColor: BRAND_COLOR }}></span>
                )}
              </div>
            )}
          </div>
          
          {/* Stats and export bar */}
          <div className="flex items-center justify-between mt-6 pt-6" style={{ borderTop: '1px solid ' + (isDark ? 'rgba(168, 162, 158, 0.2)' : 'rgba(120, 113, 108, 0.2)') }}>
            <div className={`text-sm ${muted} space-x-6 font-medium`}>
              <span>{claudeCounts.words.toLocaleString()} words</span>
              <span>{claudeCounts.chars.toLocaleString()} characters</span>
              <span>{Math.round(claudeCounts.words / 250)} min read</span>
              {loadingClaude && generationStats.wordsPerMinute > 0 && (
                <span className="font-semibold" style={{ color: BRAND_COLOR }}>
                  {((claudeCounts.words / 7000) * 100).toFixed(1)}% complete
                </span>
              )}
            </div>
            {claudeOutput && !loadingClaude && (
              <div className="flex gap-3">
                <button 
                  onClick={() => copy(claudeOutput)} 
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${btnSecondary}`}
                >
                  Copy Text
                </button>
                <button 
                  onClick={exportAsText} 
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 text-white"
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
  </div>
);
}