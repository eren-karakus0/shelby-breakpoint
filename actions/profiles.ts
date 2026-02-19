"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { verifyRecaptcha } from "@/actions/recaptcha";
import { MAX_USERNAME_LENGTH, MAX_BIO_LENGTH } from "@/lib/constants";
import { validateSession } from "./auth";

export type GetProfileParams = {
  walletAddress: string;
};

export async function getProfile(params: GetProfileParams) {
  const { walletAddress } = params;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.walletAddress, walletAddress));

  return profile || null;
}

export type SaveProfileParams = {
  username?: string | null;
  bio?: string | null;
  email?: string | null;
  x_handle?: string | null;
  marketingOptIn?: boolean;
  recaptchaToken?: string;
};

export async function saveProfile(params: SaveProfileParams) {
  const {
    username,
    bio,
    email,
    x_handle,
    marketingOptIn,
    recaptchaToken,
  } = params;

  const { address } = await validateSession();

  // Validate profile fields
  if (username && username.length > MAX_USERNAME_LENGTH) {
    throw new Error(`Username must be ${MAX_USERNAME_LENGTH} characters or less`);
  }
  if (bio && bio.length > MAX_BIO_LENGTH) {
    throw new Error(`Bio must be ${MAX_BIO_LENGTH} characters or less`);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email format");
  }
  if (x_handle && !/^@?[a-zA-Z0-9_]{1,15}$/.test(x_handle)) {
    throw new Error("Invalid X handle format");
  }

  // Verify reCAPTCHA if token is provided
  if (recaptchaToken) {
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
      throw new Error("reCAPTCHA verification failed. Please try again.");
    }
  }

  // Check if profile exists
  const existing = await getProfile({ walletAddress: address });

  if (existing) {
    // Update existing profile
    const [updated] = await db
      .update(profiles)
      .set({
        username,
        bio,
        email,
        x_handle,
        marketingOptIn: marketingOptIn ?? false,
        updatedAt: new Date(),
      })
      .where(eq(profiles.walletAddress, address))
      .returning();

    return updated;
  } else {
    // Create new profile
    const [created] = await db
      .insert(profiles)
      .values({
        walletAddress: address,
        username,
        bio,
        email,
        x_handle,
        marketingOptIn: marketingOptIn ?? false,
      })
      .returning();

    return created;
  }
}
