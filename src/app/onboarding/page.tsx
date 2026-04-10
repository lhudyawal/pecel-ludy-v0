import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import OnboardingClient from "@/components/onboarding-client";

export default async function OnboardingPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  return (
    <OnboardingClient
      userName={`${user.firstName} ${user.lastName || ""}`}
      userEmail={user.emailAddresses[0]?.emailAddress || ""}
    />
  );
}
