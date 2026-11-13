import { PageHeader } from "@/components/common/PageHeader";
import { FertilizerForm } from "@/components/fertilizer/FertilizerForm";

export default function FertilizerPage() {
  return (
    <>
      <PageHeader
        title="Fertilizer calculator"
        description="Compare your soil nutrients with the crop's needs and get DAP, Urea and MOP doses for your field."
      />
      <FertilizerForm />
    </>
  );
}
