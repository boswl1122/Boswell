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
};import React, { useEffect, useMemo, useRef, useState } from "react";

export default function BoswellRun() {
type Tab = "prep" | "claude";
const [tab, setTab] = useState<Tab>("prep");
const [theme, setTheme] = useState<"dark" | "light">("dark");
const isDark = theme === "dark";

// Simple Inter font loading
useEffect(() => {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  
  return () => {
    document.head.removeChild(link);
  };
}, []);

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

// ----- UI Styling (single declaration) -----
const pageBg = isDark
  ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100"
  : "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-slate-900";
const headerBg = isDark ? "bg-slate-900/95 backdrop-blur-xl" : "bg-white/95 backdrop-blur-xl";
const border = isDark ? "border-slate-700/50" : "border-gray-200";
const panel = isDark 
  ? "bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 shadow-xl shadow-black/10" 
  : "bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg shadow-gray-200/50";
const input = isDark
  ? "bg-slate-800/90 border-slate-600/50 text-slate-100 placeholder:text-slate-400 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm"
  : "bg-white border-2 border-gray-300 text-slate-900 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all duration-200 text-sm";
const subtle = isDark ? "text-slate-400" : "text-gray-600";
const muted = isDark ? "text-slate-500" : "text-gray-500";
const link = isDark ? "text-indigo-400 hover:text-indigo-300 transition-colors" : "text-indigo-600 hover:text-indigo-700 transition-colors";
const btnPrimary = "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 font-medium";
const btnSecondary = isDark 
  ? "bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 text-slate-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200" 
  : "bg-white/90 hover:bg-gray-50/90 border-2 border-gray-300 text-gray-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200";

return (
  <div className={`min-h-screen ${pageBg}`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
    {/* Enhanced sticky header */}
    <div className={`sticky top-0 z-30 ${headerBg} border-b ${border} shadow-sm`}>
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div>
          <h1 
            className="text-3xl font-bold tracking-tight"
            style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
          >
            Boswell Run Console
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <div className={`w-2 h-2 rounded-full bg-indigo-500 animate-pulse`}></div>
            <p className={`text-sm font-medium ${muted}`}>
              Biographical Chapter Generation System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium ${btnSecondary}`}
          >
            {isDark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Helper Menu */}
      <div className="mb-6">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${btnSecondary} hover:scale-105`}
        >
          <span className={`transition-transform duration-300 ${showHelp ? 'rotate-180' : 'rotate-0'}`}>▼</span>
          Workflow Guide
        </button>
        
        {showHelp && (
          <div className={`mt-4 rounded-lg ${panel} p-6 animate-in slide-in-from-top-2 duration-300`}>
            <h3 className="text-lg font-semibold mb-4">Complete Workflow</h3>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isDark ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-100 text-indigo-700'} flex items-center justify-center text-sm font-semibold`}>
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Configure Your Project</h4>
                  <p className={`text-sm ${muted}`}>
                    Fill in your chapter title, subject, and upload your research materials to NotebookLM. Make sure all relevant documents, interviews, and sources are in your NotebookLM project.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isDark ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-100 text-indigo-700'} flex items-center justify-center text-sm font-semibold`}>
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">Run NotebookLM Step 2A</h4>
                  <p className={`text-sm ${muted}`}>
                    Copy the "Step 2A" prompt and paste it into NotebookLM. This will generate a context summary, chronological outline, and cast of characters. Paste the result back here.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isDark ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-100 text-indigo-700'} flex items-center justify-center text-sm font-semibold`}>
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Run NotebookLM Step 2B</h4>
                  <p className={`text-sm ${muted}`}>
                    Copy the "Step 2B" prompt and paste it into NotebookLM. This will gather detailed evidence, quotes, and scenes for each chronological turning point. Paste the result back here.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isDark ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-100 text-indigo-700'} flex items-center justify-center text-sm font-semibold`}>
                  4
                </div>
                <div>
                  <h4 className="font-medium mb-1">Generate Your Chapter</h4>
                  <p className={`text-sm ${muted}`}>
                    Once both NotebookLM outputs are pasted, click "Generate Chapter" to create a complete ~7,000-word biographical chapter in Walter Isaacson's style.
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`mt-6 p-4 ${isDark ? 'bg-indigo-900/30 border-indigo-800' : 'bg-indigo-50 border-indigo-200'} rounded-lg border`}>
              <h4 className={`font-medium ${isDark ? 'text-indigo-200' : 'text-indigo-800'} mb-2`}>💡 Pro Tips</h4>
              <ul className={`text-sm ${muted} space-y-1`}>
                <li>• Make sure your NotebookLM project contains all relevant source materials before starting</li>
                <li>• Chapter titles should be specific (e.g., "Jim Barksdale — Joining Netscape (1994-1995)")</li>
                <li>• The more detailed your Step 2B output, the richer your final chapter will be</li>
                <li>• You can customize the Voice Guide to match your preferred biographical style</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced tabs */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setTab("prep")}
          className={`px-6 py-3 rounded-xl font-semibold text-sm ${
            tab === "prep" 
              ? btnPrimary
              : btnSecondary
          }`}
        >
          Setup & Research
        </button>
        <button
          onClick={() => setTab("claude")}
          className={`px-6 py-3 rounded-xl font-semibold text-sm ${
            tab === "claude" 
              ? btnPrimary
              : btnSecondary
          }`}
        >
          Generate Chapter
        </button>
      </div>

      {tab === "prep" && (
        <>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left column - Configuration */}
            <div className={`rounded-lg ${panel} p-6`}>
              <h2 className="text-lg font-semibold mb-6">Step 1: Configuration</h2>
              
              <div className="space-y-5">
                <div>
                  <label className={`block text-sm font-medium ${subtle} mb-2`}>Knowledge Base</label>
                  <select
                    className={`w-full p-3 rounded-lg ${input} transition-all appearance-none bg-no-repeat bg-right pr-10`}
                    style={{
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1.5em 1.5em'
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
                  <label className={`block text-sm font-medium ${subtle} mb-2`}>
                    Chapter Title <span className="text-indigo-600">*</span>
                  </label>
                  <input
                    className={`w-full p-3 rounded-lg ${input} transition-all`}
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    placeholder="e.g., Jim Barksdale — Childhood (1943–1960) | Joining Netscape (1994–1995)"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                  />
                  <p className={`text-xs ${muted} mt-2`}>
                    Required for ASSIGNMENT section and source materials
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${subtle} mb-2`}>Subject (Protagonist)</label>
                  <input
                    className={`w-full p-3 rounded-lg ${input} transition-all`}
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    placeholder="e.g., Jim Barksdale"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${subtle} mb-2`}>Research Goal</label>
                  <input
                    className={`w-full p-3 rounded-lg ${input} transition-all`}
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${subtle} mb-2`}>Context Notes (Optional)</label>
                  <textarea
                    className={`w-full p-3 rounded-lg ${input} transition-all`}
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    rows={4}
                    placeholder="Additional context or specific requirements..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className={`border-t ${isDark ? 'border-slate-700/40' : 'border-gray-200/60'} pt-6 mt-8`}>
                <h3 className="text-base font-semibold mb-4">Writing Style</h3>
                
                <div className="space-y-5">
                  <div>
                    <label className={`block text-sm font-medium ${subtle} mb-2`}>Voice Guide</label>
                    <textarea
                      className={`w-full p-3 rounded-lg ${input} text-sm transition-all`}
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      rows={10}
                      value={voiceGuide}
                      onChange={(e) => setVoiceGuide(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${subtle} mb-2`}>
                      Style Exemplar (Optional) - Sample text for AI reference
                    </label>
                    <textarea
                      className={`w-full p-3 rounded-lg ${input} text-sm transition-all`}
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
            <div className={`rounded-lg ${panel} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Step 2: NotebookLM Integration</h2>
                <a 
                  href="https://notebooklm.google/" 
                  target="_blank" 
                  rel="noreferrer" 
                  className={`text-sm underline ${link} font-medium`}
                >
                  Open NotebookLM ↗
                </a>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="mb-3">
                    <h3 className={`text-sm font-semibold ${subtle}`}>Step 2A: Context & Chronology</h3>
                    <p className={`text-xs ${muted} mt-1`}>Research prompt for NotebookLM</p>
                  </div>
                  <textarea
                    readOnly
                    className={`w-full p-3 rounded-lg ${input} text-sm`}
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    rows={8}
                    value={nbPrompt1}
                  />
                  <button 
                    onClick={() => copy(nbPrompt1)} 
                    className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${btnSecondary}`}
                  >
                    Copy Step 2A Prompt
                  </button>
                </div>

                <div>
                  <div className="mb-3">
                    <h3 className={`text-sm font-semibold ${subtle}`}>Step 2B: Detailed Evidence</h3>
                    <p className={`text-xs ${muted} mt-1`}>Evidence gathering prompt for NotebookLM</p>
                  </div>
                  <textarea
                    readOnly
                    className={`w-full p-3 rounded-lg ${input} text-sm`}
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    rows={8}
                    value={nbPrompt2}
                  />
                  <button 
                    onClick={() => copy(nbPrompt2)} 
                    className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${btnSecondary}`}
                  >
                    Copy Step 2B Prompt
                  </button>
                </div>

                <div className={`border-t ${isDark ? 'border-slate-700/40' : 'border-gray-200/60'} pt-6`}>
                  <h3 className={`text-sm font-semibold ${subtle} mb-3`}>Paste NotebookLM Results</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-xs font-medium ${muted} mb-2`}>
                        Step 2A Output ({nb1Counts.words.toLocaleString()} words)
                      </label>
                      <textarea
                        className={`w-full p-3 rounded-lg ${input} text-sm`}
                        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                        rows={6}
                        placeholder="Paste the full Step 2A result from NotebookLM here..."
                        value={nbOut1}
                        onChange={(e) => setNbOut1(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium ${muted} mb-2`}>
                        Step 2B Output ({nb2Counts.words.toLocaleString()} words)
                      </label>
                      <textarea
                        className={`w-full p-3 rounded-lg ${input} text-sm`}
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
          <div className={`mt-8 rounded-lg ${panel} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Step 3: Final Assembly</h2>
                <p className={`text-sm ${muted} mt-1`}>Complete prompt ready for Claude API</p>
              </div>
              <div className="flex gap-3 items-center">
                <button 
                  onClick={() => copy(assembledClaudePrompt)} 
                  className={`text-sm underline ${link} font-medium`}
                >
                  Copy Full Prompt
                </button>
                <button
                  onClick={runAndOpenClaudeTab}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={!chapter.trim() || !startsWithRole || !hasTaskLine}
                >
                  Generate Chapter →
                </button>
              </div>
            </div>
            
            <textarea
              readOnly
              className={`w-full p-4 rounded-lg ${input} text-sm`}
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              rows={16}
              value={assembledClaudePrompt}
            />
            
            <div className="flex items-center justify-between mt-4">
              <div className={`text-xs ${muted}`}>
                {counts.words.toLocaleString()} words • {counts.chars.toLocaleString()} characters
              </div>
              {status && (
                <div className="text-xs text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded">
                  {status}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "claude" && (
        <div className={`rounded-lg ${panel} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Step 4: Chapter Generation</h2>
              {chapter && (
                <h3 className={`text-lg ${subtle} mt-1 italic`}>{chapter}</h3>
              )}
              <div className="flex items-center gap-4 mt-2">
                <p className={`text-sm ${muted}`}>Using Claude 4.1 Opus</p>
                {loadingClaude && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span className={`text-sm ${subtle}`}>
                      {generationStats.wordsPerMinute > 0 && `${generationStats.wordsPerMinute} WPM • `}
                      {generationStats.estimatedCompletion}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setTab("prep")} 
                className={`text-sm underline ${link} font-medium`}
              >
                ← Back to Prep
              </button>
              {!loadingClaude ? (
                <button 
                  onClick={runClaude} 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${btnSecondary}`}
                >
                  Re-run
                </button>
              ) : (
                <button 
                  onClick={stopClaude} 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-600 hover:bg-red-700 text-white`}
                >
                  Stop
                </button>
              )}
            </div>
          </div>
          
          {claudeError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <div className={`text-sm ${isDark ? 'text-red-200' : 'text-red-600'}`}>
                {claudeError}
              </div>
            </div>
          )}

          {/* Enhanced output display */}
          <div 
            ref={outputRef}
            className={`w-full p-6 rounded-lg ${input} text-sm leading-relaxed overflow-y-auto transition-all duration-500`}
            style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              minHeight: '400px',
              maxHeight: loadingClaude ? '600px' : '500px',
              transition: 'max-height 0.5s ease-in-out'
            }}
          >
            {loadingClaude && !displayedOutput ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className={`text-sm ${muted}`}>Generating your chapter...</p>
                  <p className={`text-xs ${subtle} mt-1`}>This may take a few minutes for a 4,000-7,000 word response.</p>
                </div>
              </div>
            ) : (
              <div className="prose prose-slate max-w-none whitespace-pre-wrap">
                {displayedOutput}
                {loadingClaude && displayedOutput && (
                  <span className="inline-block w-2 h-5 bg-indigo-500 animate-pulse ml-1"></span>
                )}
              </div>
            )}
          </div>
          
          {/* Stats and export bar */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div className={`text-xs ${muted} space-x-4`}>
              <span>{claudeCounts.words.toLocaleString()} words</span>
              <span>{claudeCounts.chars.toLocaleString()} characters</span>
              <span>{Math.round(claudeCounts.words / 250)} min read</span>
              {loadingClaude && generationStats.wordsPerMinute > 0 && (
                <span className="text-indigo-600">
                  {((claudeCounts.words / 7000) * 100).toFixed(1)}% complete
                </span>
              )}
            </div>
            {claudeOutput && !loadingClaude && (
              <div className="flex gap-2">
                <button 
                  onClick={() => copy(claudeOutput)} 
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${btnSecondary}`}
                >
                  Copy Text
                </button>
                <button 
                  onClick={exportAsText} 
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${btnPrimary}`}
                >
                  Download .txt
                </button>
              </div>
            )}
          </div>

          {/* CSS for fade-in animation */}
          <style jsx>{`
            @keyframes fade-in {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fade-in {
              animation: fade-in 0.6s ease-out forwards;
              opacity: 0;
            }
          `}</style>
        </div>
      )}
    </div>
  </div>
);
}