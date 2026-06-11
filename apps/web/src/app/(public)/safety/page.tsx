import { LegalPage } from "@/features/legal/components/LegalPage";
import { safetyPolicy } from "@/features/legal/lib/legal-content";

export default function SafetyPage() {
  return <LegalPage document={safetyPolicy} />;
}
