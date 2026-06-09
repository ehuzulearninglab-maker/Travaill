import { CantineAdminClient } from "@/components/cantine-admin-client";
import { isCantineAdmin, isCantineAdminPasswordConfigured } from "@/lib/cantine-admin-auth";
import { getCantineReferenceBundle } from "@/lib/cantine-storage";

export const dynamic = "force-dynamic";

export default async function AdminCantinePage() {
  const [authenticated, bundle] = await Promise.all([isCantineAdmin(), getCantineReferenceBundle()]);

  return (
    <CantineAdminClient
      authenticated={authenticated}
      passwordConfigured={isCantineAdminPasswordConfigured()}
      initialReference={bundle.reference}
      initialStatus={bundle.status}
    />
  );
}
