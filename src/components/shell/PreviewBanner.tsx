import { Info } from "lucide-react";

/**
 * Marks a page (or section) as a frontend-only preview: the UI is real but it
 * is not wired to persistent data. Used on payroll / partnerships / analytics /
 * AI Lab and any simulated flow.
 */
export function PreviewBanner({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <span className="font-medium">Preview.</span>{" "}
        {children ??
          "This screen demonstrates the intended workflow with sample data. Actions here are simulated and not saved."}
      </p>
    </div>
  );
}
