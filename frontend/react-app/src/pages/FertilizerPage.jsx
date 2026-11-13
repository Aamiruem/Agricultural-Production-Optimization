import { WalletCards } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FertilizerForm } from "@/components/fertilizer/FertilizerForm";

export default function FertilizerPage() {
  return (
    <>
      <PageHeader page="fertilizer" icon={WalletCards} color="#d97706" />
      <FertilizerForm />
    </>
  );
}
