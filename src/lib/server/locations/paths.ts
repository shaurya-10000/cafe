import { revalidatePath } from "next/cache";

export function revalidateLocationPaths(): void {
  revalidatePath("/");
  revalidatePath("/admin");
}
