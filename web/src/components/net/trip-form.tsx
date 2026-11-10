"use client";

export type TripDraft = { origin: string; destination: string; depot: string; viaDepot: boolean; delivery: string; vehicle: string; priority: string };
export function TripForm({ draft, onChange, onSubmit }: { draft: TripDraft; onChange: (draft: TripDraft) => void; onSubmit: () => void }) {
  function field(key: keyof TripDraft, value: string | boolean) { onChange({ ...draft, [key]: value }); }
  return <form className="surface-card trip-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
    <h2>Stops and hazards</h2><p className="sample-note">Sample data. Replace sample stops with real addresses before opening Maps.</p>
    <label>Start<input name="origin" value={draft.origin} maxLength={160} required onChange={(event) => field("origin", event.target.value)} /></label>
    <label>Destination<input name="destination" value={draft.destination} maxLength={160} required onChange={(event) => field("destination", event.target.value)} /></label>
    <label>Delivery<select value={draft.delivery} onChange={(event) => field("delivery", event.target.value)}><option>Medical supplies</option><option>Food and water</option><option>Emergency equipment</option></select></label>
    <label>Vehicle<select value={draft.vehicle} onChange={(event) => field("vehicle", event.target.value)}><option>Emergency transport vehicle</option><option>Van</option><option>Truck</option></select></label>
    <label>Priority<select value={draft.priority} onChange={(event) => field("priority", event.target.value)}><option>Urgent</option><option>Planned delivery</option></select></label>
    <label className="checkbox-label"><input type="checkbox" checked={draft.viaDepot} onChange={(event) => field("viaDepot", event.target.checked)} />Stop at an emergency depot</label>
    {draft.viaDepot && <label>Depot<input value={draft.depot} maxLength={160} required onChange={(event) => field("depot", event.target.value)} /></label>}
    <button type="submit" className="primary-button">Update trip brief</button>
  </form>;
}
