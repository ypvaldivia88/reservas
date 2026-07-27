import { redirect } from "next/navigation";

export default function PlatformSalonesRedirect() {
  redirect("/admin/platform/tenants");
}
