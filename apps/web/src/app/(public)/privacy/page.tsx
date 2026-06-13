import { LegalPage } from "@/features/legal/components/LegalPage";
import { privacyPolicy } from "@/features/legal/lib/legal-content";

export default function PrivacyPage() {
  return <LegalPage document={privacyPolicy} />;
}
