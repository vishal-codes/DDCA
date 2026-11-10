import Link from "next/link";
import { MethodsContent } from "@/components/methods/methods-content";

export default function DataAndMethodsPage() {
  return (
    <div className="methods-page">
      <article className="surface-card methods-article" aria-labelledby="methods-page-title">
        <div className="dialog-heading"><h1 id="methods-page-title">Data and methods</h1><Link href="/" className="text-link">Back to map</Link></div>
        <MethodsContent />
      </article>
    </div>
  );
}
