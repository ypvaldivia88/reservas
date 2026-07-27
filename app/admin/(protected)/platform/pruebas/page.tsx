import { redirect } from "next/navigation";

export default function PlatformPruebasRedirect() {
  redirect("/admin/platform/tenants?status=trial");
}
