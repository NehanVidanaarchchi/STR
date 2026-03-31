import { cookies } from "next/headers";

export async function getProviderSession() {
  const cookie = (await cookies()).get("provider_session");
  if (!cookie) return null;
  return JSON.parse(cookie.value);
}
