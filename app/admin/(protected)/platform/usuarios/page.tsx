import { redirect } from "next/navigation";

export default function PlatformUsuariosRedirect() {
  redirect("/admin/platform/tenants");
}
