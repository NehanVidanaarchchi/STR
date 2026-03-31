import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import UsersTable from "./users/page";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;

  if (!adminSession) {
    redirect("/auth/login");
  }

  let adminUser = null;

  try {
    adminUser = JSON.parse(adminSession);
  } catch {
    redirect("/auth/login");
  }

  if (!adminUser || adminUser.type !== "admin") {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] border border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-6">
          <div>
            {/* <h2 className="text-[22px] leading-[28px] font-medium text-[#0F172A]">
              Users
            </h2>
            <p className="text-[14px] leading-[20px] text-[#64748B] mt-1">
              Manage all platform users and their permissions
            </p> */}
          </div>
        </div>

        <UsersTable />
      </div>
    </div>
  );
}