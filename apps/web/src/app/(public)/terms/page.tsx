import { LegalPage } from "@/features/legal/components/LegalPage";
import { termsOfUse } from "@/features/legal/lib/legal-content";

export default function TermsPage() {
  return <LegalPage document={termsOfUse} />;
}
