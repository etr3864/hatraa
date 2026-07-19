import { cookies } from "next/headers";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  ADMIN_SESSION_COOKIE,
  validateAdminSessionCookie,
} from "@/backend/services/security/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!session || !validateAdminSessionCookie(session)) {
    return <AdminLogin />;
  }

  return <AdminShell>{children}</AdminShell>;
}

