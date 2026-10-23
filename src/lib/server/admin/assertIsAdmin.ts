import { auth } from "@clerk/nextjs/server";

import { getAdminAccess } from "./adminAccess";

/** Throws with a user-safe message unless the caller is a signed-in admin. */
export async function assertIsAdmin(): Promise<void> {
  const { userId } = await auth();

  if (!userId) throw new Error("Not signed in.");

  const access = await getAdminAccess(userId);

  if (access.status === "error") {
    console.error(
      "[admin] admin lookup failed",
      { userId, code: access.code },
      access.cause,
    );

    throw new Error("Couldn't verify admin access.");
  }

  if (access.status === "forbidden") throw new Error("Admin access required.");
}
