"use client";

import { useAppShell } from "./app-shell";

export function Footer() {
  const { openMethods } = useAppShell();
  return (
    <footer className="app-footer">
      <p>Not an official source. In an emergency call 911 or your local emergency number.</p>
      <div><span>Sample data for design review.</span> <button type="button" onClick={openMethods} className="text-link" aria-haspopup="dialog">Data and methods</button></div>
    </footer>
  );
}
