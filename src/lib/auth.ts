import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

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

        const user = await db.user.findFirst({ where: { email } });
        if (!user) return null;

        // Password stored in clerkId field (repurposed) — format: "hash:bcrypt_hash"
        const storedHash = user.clerkId.startsWith("hash:") ? user.clerkId.slice(5) : null;
        if (!storedHash) return null;

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
  pages: {
    signIn: "/sign-in",
    newUser: "/sign-up",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        (session as any).userId = token.userId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "threatcast-secret-change-in-production",
});
