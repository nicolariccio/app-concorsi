import "server-only";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";

export async function richiediAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
