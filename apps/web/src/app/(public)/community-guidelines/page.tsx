import { LegalPage } from "@/features/legal/components/LegalPage";
import { communityGuidelines } from "@/features/legal/lib/legal-content";

export default function CommunityGuidelinesPage() {
  return <LegalPage document={communityGuidelines} />;
}
