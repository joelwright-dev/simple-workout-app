// Edge-safe Auth.js config shared by middleware and the full server config.
// MUST NOT import Node-only modules (pg, bcrypt) — middleware runs on the edge.

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // real providers are added in auth.ts (Node runtime)
  callbacks: {
    // Route protection for middleware: everything requires auth except the
    // auth pages themselves.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname === "/login" || nextUrl.pathname === "/signup";
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
