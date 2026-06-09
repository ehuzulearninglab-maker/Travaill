import { CantineApp } from "@/components/cantine-app";
import { getActiveCantineReference } from "@/lib/cantine-storage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const reference = await getActiveCantineReference();
  return <CantineApp initialReference={reference} />;
}
