"use server";

// Server actions — the boundary between the client and the database/auth.

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { auth, signIn, signOut } from "@/auth";
import {
  createUser,
  getUserByEmail,
  getUserState,
  saveUserState,
} from "@/lib/db";
import { initialState, reconcile } from "@/lib/storage";
import type { AppState } from "@/lib/types";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authenticated.");
  return userId;
}

/** Load the signed-in user's state, seeding a fresh program on first use. */
export async function loadState(): Promise<AppState> {
  const userId = await requireUserId();
  const existing = await getUserState(userId);
  if (existing) return reconcile(existing);
  const seeded = initialState();
  await saveUserState(userId, seeded);
  return seeded;
}

/** Persist the signed-in user's state. */
export async function persistState(state: AppState): Promise<void> {
  const userId = await requireUserId();
  await saveUserState(userId, reconcile(state));
}

/** Login form action (useActionState). Returns an error string, or redirects. */
export async function authenticate(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return "Enter your email and password.";
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) return "Invalid email or password.";
    throw error; // re-throw redirects and anything unexpected
  }
}

/** Signup form action (useActionState). Creates the account, then signs in. */
export async function register(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");

  if (!/.+@.+\..+/.test(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";

  if (await getUserByEmail(email)) {
    return "An account with that email already exists.";
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await createUser(email, hash);
  await saveUserState(user.id, initialState());

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) return "Account created — please sign in.";
    throw error;
  }
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
