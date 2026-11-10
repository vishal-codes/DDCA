import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function SetupPage() {
  return (
    <main className="grid min-h-screen place-items-center p-8">
      <section aria-labelledby="setup-title" className="setup-card">
        <div className="flex items-center justify-between gap-8">
          <span className="brand">SafeEarth</span>
          <ThemeToggle />
        </div>
        <p className="sample-label">Sample data</p>
        <h1 id="setup-title">Ready for screen layouts</h1>
        <p className="setup-description">
          Disaster preparedness and emergency response. Screen layouts are coming next.
        </p>
        <p className="setup-disclaimer">
          Not an official source. In an emergency call 911 or your local emergency number.
        </p>
      </section>
    </main>
  );
}
