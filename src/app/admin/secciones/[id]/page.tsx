import { notFound } from "next/navigation";
import { getSectionById } from "@/lib/firebase/sections";
import { SectionForm } from "@/components/admin/SectionForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSectionPage({ params }: Props) {
  const { id } = await params;
  const section = await getSectionById(id);

  if (!section) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-light">Editar sección</h1>
      <SectionForm section={section} />
    </div>
  );
}
