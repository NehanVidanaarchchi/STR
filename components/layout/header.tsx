import { cookies } from "next/headers";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const cookieStore = await cookies(); 

  const provider = cookieStore.get("provider_session")?.value;
  const member = cookieStore.get("team_member_session")?.value;

  const isLoggedIn = Boolean(provider || member);

  return <HeaderClient isLoggedIn={isLoggedIn} />;
}
