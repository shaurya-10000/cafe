import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

import AuthLayout from "../../auth/AuthLayout";
import { AUTH_ELEMENTS } from "../../auth/clerkAppearance";

export const metadata: Metadata = {
  title: "Sign Up | Cafe Workspace",
  description:
    "Create an account to track your orders, manage subscriptions, and unlock exclusive community rewards.",
};

const AUTH_ROUTES = {
  signIn: "/sign-in",
  signUp: "/sign-up",
} as const;

const AUTH_BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=2070&auto=format&fit=crop";

const AUTH_BADGES = ["Sourcing", "Roasting", "Community"] as const;

const APPEARANCE = { elements: AUTH_ELEMENTS };

export default function SignUpPage() {
  return (
    <AuthLayout
      bgImageSrc={AUTH_BACKGROUND_IMAGE}
      headline={
        <>
          Join the <br />
          High-Fidelity <br />
          Movement.
        </>
      }
      description="Create an account to track your orders, manage subscriptions, and unlock exclusive community rewards."
      badges={AUTH_BADGES}
    >
      <div className="flex w-full items-center justify-center">
        <SignUp
          routing="path"
          path={AUTH_ROUTES.signUp}
          signInUrl={AUTH_ROUTES.signIn}
          appearance={APPEARANCE}
        />
      </div>
    </AuthLayout>
  );
}
