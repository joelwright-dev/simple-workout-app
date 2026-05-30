// Edge middleware: gates every app route behind auth using the edge-safe config.
// Static assets, the PWA files, and the auth API are excluded via the matcher.

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icons|manifest.json|sw.js|favicon.ico).*)",
  ],
};
