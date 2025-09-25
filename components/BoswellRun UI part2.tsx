import React, { useEffect, useMemo, useRef, useState } from "react";

export default function BoswellRun() {
  type Tab = "prep" | "claude";
  const [tab, setTab] = useState<Tab>("prep");

  // Config
  const [kb, setKb] = useState("Interview Transcripts");
  const [chapter, setChapter] = useState("");
  const [subject, setSubject] = useState("Jim Barksdale");
  const [goal, setGoal] = useState(
    "Chronology, key quotes, key scenes, and all information related to this chapter (enough for a full draft)."
  );
  const [notes, setNotes] = useState("");

  // Voice guide / exemplar
  const [voiceGuide, setVoiceGuide] = useState(`Voice Guide
- Open with a vivid, grounded scene tied to the chapter’s tension.
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

  // Optional style exemplar (short passage; style only, not sources)
  const [voiceExemplar, setVoiceExemplar] = useState(`EXEMPLAR — Isaacson-like passage (style only; do not copy)

[Excerpt: Aspen, Christmas 1994]
With the kids gathered around a beige desktop in the rental house, Barksdale typed a case number and watched the browser fetch a court decision in seconds. "Wow, how did it do that?" Susan asked. Betsy leaned in next; a lesson plan appeared as quickly as if it were on the hard drive. David wanted concert dates; a fan site listed a New Orleans show the next April. "It is not in the machine," Barksdale said. "All I have is a browser and a network." Newspapers from Tokyo and London, a virtual walk through the Louvre—the room filled with the sense that something fundamental had shifted. By the end of the night, what had seemed reckless began to feel inevitable.`);

  // NotebookLM outputs
  const [nbOut1, setNbOut1] = useState(""); // Step 1A
  const [nbOut2, setNbOut2] = useState(""); // Step 1B

  // Claude API state
  const [claudeOutput, setClaudeOutput] = useState("");
  const [loadingClaude, setLoadingClaude] = useState(false);
  const [claudeError, setClaudeError] = useState<string | null>(null);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);

  // UI feedback
  const [status, setStatus] = useState<string | null>(null);

  // Refs for UX niceties
  const claudeRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (claudeRef.current) {
      claudeRef.current.scrollTop = claudeRef.current.scrollHeight;
    }
  }, [claudeOutput]);

  // Helpers
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

  async function pasteTo(setter: (s: string) => void) {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) setter(txt);
      else setStatus("Clipboard empty");
    } catch {
      setStatus("Paste blocked — use ⌘/Ctrl+V");
    } finally {
      setTimeout(() => setStatus(null), 1400);
    }
  }

  // NB-LM prompts (with People & Roles and subject injection)
  const nbPrompt1 = useMemo(
    () =>
      `\nBOSWELL RUN — STEP 1A (NotebookLM - Context + Chronology + People)
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
   - Do NOT repeat full quotes here; save quotes for Step 1B.

Output as clearly labeled sections.
`,
    [kb, chapter, goal, notes, subject]
  );

  const nbPrompt2 = useMemo(
    () =>
      `\nBOSWELL RUN — STEP 1B (NotebookLM - Detailed Evidence + People per Event)
Knowledge Base: ${kb}
Chapter: ${chapter || "(unspecified)"}
Main Subject: ${subject || "(unspecified)"}
Goal: ${goal}
Context notes (optional):
${notes || "(none)"}

Please produce:
1) Expanded report for each chronological turning point (matching Step 1A numbering).
   - Brief recap of the event (1–2 sentences).
   - People Involved: list the key people present or influential; for each include role/relationship to ${subject || "the main subject"} (1 line).
   - Sub-bullets with ALL relevant quotes.
     • Identify who said each quote, with source citation and estimated timing (e.g., “late 1994, age ~51”).
     • If paraphrasing is stronger than quoting, do both (short quote + 1–2 sentence paraphrase).
   - Key scenes if identifiable (characters, setting, source).

2) Bibliography of all sources used (primary vs secondary).
   - Provide full citations and map them to the events/quotes above (e.g., [TP-3] → Source A, Source B).

Output as clearly labeled sections.
`,
    [kb, chapter, goal, notes, subject]
  );

  // System header (simplified & explicit)
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
   - Group related quotes to build insight; paraphrase when exact words aren’t essential.
   - Keep NB-LM estimated timing explicit when relevant (e.g., “late 1994, age ~51”).
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

  // Assemble the full prompt
  const assembledClaudePrompt = useMemo(() => {
    const parts: string[] = [];
    parts.push(claudeSystemHeader);
    parts.push(voiceGuide.trim());
    if (voiceExemplar.trim()) parts.push("\n[STYLE EXEMPLAR — tone only]\n" + voiceExemplar.trim());
    parts.push("\n[NOTEBOOKLM OUTPUT — STEP 1A]\n" + (nbOut1.trim() || "(paste Step 1A here)"));
    parts.push("\n[NOTEBOOKLM OUTPUT — STEP 1B]\n" + (nbOut2.trim() || "(paste Step 1B here)"));
    parts.push(`\nFINAL INSTRUCTION\n- CRITICAL: Do not stop until you’ve produced ~7,000 words. If you approach the end short of this, expand scenes and quotes before concluding.`);
    return parts.join("\n\n");
  }, [claudeSystemHeader, voiceGuide, voiceExemplar, nbOut1, nbOut2]);

  const startsWithRole = assembledClaudePrompt.trimStart().toLowerCase().startsWith("you are writing");
  const hasTaskLine = assembledClaudePrompt.includes("ASSIGNMENT");

  // STREAMING (one pass)
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

    const controller = new AbortController();
    setAbortCtrl(controller);

    try {
      await streamOnce(
        {
          prompt: assembledClaudePrompt,
          maxTokens: 28000,
        },
        (chunk) => {
          setClaudeOutput((prev) => prev + chunk);
        },
        controller.signal
      );
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setClaudeError("Stopped by user");
      } else {
        setClaudeError(e?.message || "Stream failed");
      }
    } finally {
      setLoadingClaude(false);
      setAbortCtrl(null);
    }
  }

  function stopClaude() {
    try {
      abortCtrl?.abort();
    } catch {}
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-800 via-neutral-900 to-black text-neutral-100">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/60 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Boswell — Run Console</h1>
            <p className="text-xs text-neutral-400">Step 1: NotebookLM → Step 2: Assemble → Step 3: Claude (API)</p>
          </div>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => {
                setNbOut1("");
                setNbOut2("");
                setClaudeOutput("");
              }}
              className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
            >
              Clear Outputs
            </button>
            <button
              onClick={() => copy(assembledClaudePrompt)}
              className="px-2 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-600"
            >
              Copy Full Prompt
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("prep")}
            className={`px-3 py-2 rounded-xl border border-neutral-800 ${tab === "prep" ? "bg-white/10" : "bg-white/5"}`}
          >
            Step 1–2: Prep & Assemble
          </button>
          <button
            onClick={() => setTab("claude")}
            className={`px-3 py-2 rounded-xl border border-neutral-800 ${tab === "claude" ? "bg-white/10" : "bg-white/5"}`}
          >
            Step 3: Claude (API)
          </button>
        </div>

        {tab === "prep" && (
          <>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              {/* Left column */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm text-neutral-400">Knowledge Base</label>
                    <select
                      className="w-full mt-1 p-3 rounded-xl bg-black/30 border border-neutral-800 focus:outline-none"
                      value={kb}
                      onChange={(e) => setKb(e.target.value)}
                    >
                      <option>Interview Transcripts</option>
                      <option>Books/Media</option>
                      <option>Web Articles</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-neutral-400">Chapter (feeds the ASSIGNMENT)</label>
                    <input
                      className="w-full mt-1 p-3 rounded-xl bg-black/30 border border-neutral-800 focus:outline-none"
                      placeholder="e.g., Jim Barksdale — Childhood (1943–1960) | Joining Netscape (1994–1995)"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Appears in <strong>ASSIGNMENT</strong> and <strong>SOURCE MATERIALS</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-neutral-400">Subject (protagonist)</label>
                    <input
                      className="w-full mt-1 p-3 rounded-xl bg-black/30 border border-neutral-800 focus:outline-none"
                      placeholder="e.g., Jim Barksdale"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-neutral-400">Goal</label>
                    <input
                      className="w-full mt-1 p-3 rounded-xl bg-black/30 border border-neutral-800 focus:outline-none"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-neutral-400">Optional notes</label>
                    <textarea
                      className="w-full mt-1 p-3 rounded-xl bg-black/30 border border-neutral-800"
                      rows={6}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-neutral-400">Voice Guide</label>
                    <textarea
                      className="w-full mt-1 p-3 rounded-xl bg-black/30 border border-neutral-800 text-xs"
                      rows={8}
                      value={voiceGuide}
                      onChange={(e) => setVoiceGuide(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-neutral-400">
                      Voice Exemplar (optional — short style sample you can delete)
                    </label>
                    <textarea
                      className="w-full mt-1 p-3 rounded-xl bg-black/30 border border-neutral-800 text-xs"
                      rows={8}
                      value={voiceExemplar}
                      onChange={(e) => setVoiceExemplar(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-400">Step 1A — Context + Chronology (send to NotebookLM)</div>
                    <a
                      href="https://notebooklm.google/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline text-emerald-400"
                    >
                      Open NotebookLM ↗
                    </a>
                  </div>
                  <textarea
                    readOnly
                    className="w-full mt-2 p-3 rounded-xl bg-black/30 border border-neutral-800 text-xs"
                    rows={8}
                    value={nbPrompt1}
                  />
                  <div className="flex gap-2 mt-2 text-xs">
                    <button
                      onClick={() => copy(nbPrompt1)}
                      className="px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600"
                    >
                      Copy 1A
                    </button>
                    <button
                      onClick={() => pasteTo(setNbOut1)}
                      className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
                    >
                      Paste → 1A Output
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-neutral-400">Step 1B — Detailed Evidence + Bibliography (send to NotebookLM)</div>
                  <textarea
                    readOnly
                    className="w-full mt-2 p-3 rounded-xl bg-black/30 border border-neutral-800 text-xs"
                    rows={8}
                    value={nbPrompt2}
                  />
                  <div className="flex gap-2 mt-2 text-xs">
                    <button
                      onClick={() => copy(nbPrompt2)}
                      className="px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600"
                    >
                      Copy 1B
                    </button>
                    <button
                      onClick={() => pasteTo(setNbOut2)}
                      className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
                    >
                      Paste → 1B Output
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-neutral-400">Paste NotebookLM Outputs Here</div>
                  <label className="text-xs text-neutral-500 mt-2 block">
                    NB-LM Output — Step 1A (Context + Chronology)
                  </label>
                  <textarea
                    className="w-full mt-1 p-3 rounded-xl bg-black/30 border border-neutral-800 text-xs"
                    rows={8}
                    placeholder="Paste the full Step 1A result from NB-LM."
                    value={nbOut1}
                    onChange={(e) => setNbOut1(e.target.value)}
                  />
                  <div className="text-[11px] text-neutral-500 mt-1">
                    {nb1Counts.words.toLocaleString()} words • {nb1Counts.chars.toLocaleString()} chars
                  </div>

                  <label className="text-xs text-neutral-500 mt-3 block">
                    NB-LM Output — Step 1B (Detailed Evidence + Bibliography)
                  </label>
                  <textarea
                    className="w-full mt-1 p-3 rounded-xl bg-black/30 border border-neutral-800 text-xs"
                    rows={10}
                    placeholder="Paste the full Step 1B result from NB-LM."
                    value={nbOut2}
                    onChange={(e) => setNbOut2(e.target.value)}
                  />
                  <div className="text-[11px] text-neutral-500 mt-1">
                    {nb2Counts.words.toLocaleString()} words • {nb2Counts.chars.toLocaleString()} chars
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-400">Step 2 — Assemble & Copy Prompt for Claude</div>
                <div className="flex gap-3 items-center">
                  <button onClick={() => copy(claudeSystemHeader)} className="text-xs underline text-emerald-400">
                    Copy Header Only
                  </button>
                  <button onClick={() => copy(assembledClaudePrompt)} className="text-xs underline text-emerald-400">
                    Copy FULL Assembled Prompt
                  </button>
                  <button
                    onClick={runAndOpenClaudeTab}
                    className="px-3 py-2 rounded-2xl bg-emerald-600/90 hover:bg-emerald-600 disabled:opacity-40"
                    disabled={!chapter.trim() || !startsWithRole || !hasTaskLine}
                  >
                    Run in Claude →
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                This is exactly what will be sent to Claude: header, Voice Guide, optional Style Exemplar, and both NotebookLM
                outputs.
              </p>
              <textarea
                readOnly
                className="w-full mt-2 p-3 rounded-xl bg-black/30 border border-neutral-800 text-xs"
                rows={16}
                value={assembledClaudePrompt}
              />
              <div className="mt-2 text-xs text-neutral-500">
                Length: {counts.words.toLocaleString()} words • {counts.chars.toLocaleString()} chars
              </div>
              {status && <div className="mt-3 text-xs text-emerald-300">{status}</div>}
            </div>
          </>
        )}

        {tab === "claude" && (
          <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-400">
                Step 3 — Claude (API) <span className="ml-2 opacity-60">Model picked on server (prefers 4.1 Opus)</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setTab("prep")} className="text-xs underline text-emerald-400">
                  ← Back to Prep
                </button>
                {!loadingClaude ? (
                  <button onClick={runClaude} className="text-xs underline text-emerald-400">
                    Re-run
                  </button>
                ) : (
                  <button onClick={stopClaude} className="text-xs underline text-emerald-400">
                    Stop
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-neutral-400">We auto-send the assembled prompt when this tab opens.</p>
            {claudeError && <div className="mt-3 text-xs text-rose-300">{claudeError}</div>}
            <textarea
              ref={claudeRef}
              readOnly
              className="w-full mt-3 p-3 rounded-2xl bg-black/30 border border-neutral-800 text-xs"
              rows={22}
              value={loadingClaude && !claudeOutput ? "Running Claude…" : claudeOutput}
              placeholder="Claude’s response will appear here"
            />
            <div className="text-[11px] text-neutral-500 mt-1">
              {claudeCounts.words.toLocaleString()} words • {claudeCounts.chars.toLocaleString()} chars
            </div>
          </div>
        )}
      </div>
    </div>
  );
}