"use client";

import { useEffect, useRef, useState } from "react";
import { getAskExamples, getSampleTime } from "@/lib/data/workspace";
import { useAppShell } from "@/components/shell/app-shell";
import { Dialog } from "@/components/shared/dialog";
import { SampleCitation } from "@/components/shared/sample-citation";
import { DataAgeChip } from "@/components/shared/data-age-chip";

type Message = { question: string; answer: string; sourceName: string; href: string | null; updatedAt: string };
const unavailable = "I don't have that for this area. In an emergency call 911 or your local emergency number.";

export function AskDrawer({ onClose }: { onClose: () => void }) {
  const { regionId, previewState } = useAppShell();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [messages.length]);
  const examples = getAskExamples();
  function choose(example: typeof examples[number]) {
    const supported = regionId === "los-angeles" || (example.id === "coverage" && regionId !== null);
    setMessages((value) => [...value, { ...example, answer: supported ? example.answer : unavailable,
      sourceName: supported ? example.sourceName : "Sample catalog: no matching information", href: supported ? example.href : null,
    }]);
  }
  return <Dialog title="Ask" kind="ask" onClose={onClose}>
    <p className="sample-note">Sample data. Choose a canned example. No assistant or web browsing is running.</p>
    <div className="ask-prompts">{examples.map((example) => <button type="button" key={example.id} onClick={() => choose(example)}>{example.question}</button>)}</div>
    <div ref={logRef} className="ask-conversation" role="log" aria-label="Sample conversation" aria-live="polite">
      {!messages.length && <p className="caption">{regionId ? "Ask about the sample region." : "Choose a region for sample answers."}</p>}
      {messages.map((message, index) => <div className="ask-message-pair" key={index}>
        <p className="surface-card ask-question">{message.question}</p>
        <article className="surface-card ask-answer"><p>{message.answer}</p>
          <div className="chip-group">{message.href ? <a className="chip source-link" href={message.href} target="_blank" rel="noopener noreferrer">{message.sourceName}</a> : <span className="chip">{message.sourceName}</span>}<DataAgeChip updatedAt={message.updatedAt} label="Sample snapshot" isStale={previewState === "stale" || previewState === "offline"} /></div>
          <SampleCitation sourceName={message.sourceName} updatedAt={message.updatedAt} />
        </article>
      </div>)}
    </div>
    <div className="ask-compose"><p className="surface-card ask-boundary">Follow official orders. This sample cannot tell you to evacuate or stay.</p>
      <form onSubmit={(event) => { event.preventDefault(); if (!input.trim()) return; setMessages((value) => [...value, { question: input.trim(), answer: unavailable, sourceName: "Sample catalog: no matching information", href: null, updatedAt: getSampleTime() }]); setInput(""); }}>
        <label className="sr-only" htmlFor="ask-input">Ask about roads, shelters or alerts</label>
        <input id="ask-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about roads, shelters or alerts" maxLength={500} required />
        <button type="submit" className="primary-button">Send</button>
      </form>
    </div>
  </Dialog>;
}
