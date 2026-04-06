export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  // Clear the NextAuth session cookie and redirect
  const response = NextResponse.redirect(new URL("/sign-in", "https://threatcast.io"));
  response.cookies.delete("next-auth.session-token");
  response.cookies.delete("__Secure-next-auth.session-token");
  response.cookies.delete("next-auth.csrf-token");
  response.cookies.delete("__Secure-next-auth.csrf-token");
  response.cookies.delete("next-auth.callback-url");
  response.cookies.delete("__Secure-next-auth.callback-url");
  return response;
}
