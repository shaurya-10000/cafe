import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

import AuthLayout from "../../auth/AuthLayout";
import { AUTH_ELEMENTS } from "../../auth/clerkAppearance";

export const metadata: Metadata = {
  title: "Sign In | Cafe Workspace",
  description:
    "Sign in to your Cafe Workspace account to manage orders and personalized brew settings.",
};

const AUTH_ROUTES = {
  signIn: "/sign-in",
  signUp: "/sign-up",
} as const;

const AUTH_BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop";

const AUTH_BADGES = ["Curating Excellence"] as const;

const APPEARANCE = { elements: AUTH_ELEMENTS };

export default function SignInPage() {
  return (
    <AuthLayout
      bgImageSrc={AUTH_BACKGROUND_IMAGE}
      headline={
        <>
          Back to <br />
          the Source.
        </>
      }
      description="Welcome back to your coffee dashboard. Sign in to manage your orders and personalized brew settings."
      badges={AUTH_BADGES}
    >
      <div className="flex w-full items-center justify-center">
        <SignIn
          routing="path"
          path={AUTH_ROUTES.signIn}
          signUpUrl={AUTH_ROUTES.signUp}
          appearance={APPEARANCE}
        />
      </div>
    </AuthLayout>
  );
}
