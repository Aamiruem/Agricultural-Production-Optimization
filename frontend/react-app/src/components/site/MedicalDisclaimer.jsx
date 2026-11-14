import { Info } from "lucide-react";

import { MEDICAL_DISCLAIMER } from "@/data/content/health";

/** Required notice on every page with health or nutrition information. */
export function MedicalDisclaimer() {
  return (
    <aside className="medical-disclaimer" role="note" aria-label="Medical disclaimer">
      <Info size={20} aria-hidden="true" />
      <p>
        <b>Medical disclaimer:</b> {MEDICAL_DISCLAIMER}
      </p>
    </aside>
  );
}
