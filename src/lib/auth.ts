import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = (credentials.email as string).toLowerCase();
        const password = credentials.password as string;

        // Find user by email with a password hash
        const user = await db.user.findFirst({
          where: { email, clerkId: { startsWith: "hash:" } },
        });
        if (!user) return null;

        const storedHash = user.clerkId.slice(5); // Remove "hash:" prefix
        const valid = await bcrypt.compare(password, storedHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.userId) (session as any).userId = token.userId;
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || (() => { console.warn("[auth] WARNING: AUTH_SECRET not set — using ephemeral secret. Sessions will not persist across deploys."); return require("crypto").randomBytes(32).toString("hex"); })(),
});
