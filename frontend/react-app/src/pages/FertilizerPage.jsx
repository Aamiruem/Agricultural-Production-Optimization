import { WalletCards } from "lucide-react";
import { G } from "@/lib/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { FertilizerForm } from "@/components/fertilizer/FertilizerForm";

export default function FertilizerPage() {
  return (
    <>
      <PageHeader page="fertilizer" icon="compost" color={G.orange} />
      <FertilizerForm />
    </>
  );
}
