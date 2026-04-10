import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SalesDashboard } from "@/components/sales-dashboard";
import { SupervisorDashboard } from "@/components/supervisor-dashboard";
import { AdminDashboard } from "@/components/admin-dashboard";

export default async function DashboardPage() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    console.log("Dashboard: Auth check -", { userId: !!userId, user: !!user, userIdValue: userId });

    if (!userId || !user) {
      console.log("Dashboard: Not authenticated, redirecting to /sign-in");
      redirect("/sign-in");
    }

    console.log("Dashboard: User authenticated -", userId);

    const supabase = await createSupabaseServerClient();

    console.log("Dashboard: Supabase client created");

    // Get user profile from database
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    console.log("Dashboard: Supabase query result", {
      hasProfile: !!profile,
      profileId: profile?.id,
      error: error ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      } : null,
    });

    if (error) {
      console.error("Dashboard: Error fetching profile:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    } else {
      console.log("Dashboard: Profile found -", profile?.id);
    }

    if (error || !profile) {
      console.log("Dashboard: Profile not found, attempting to create...");
      // Create profile if doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          clerk_id: userId,
          full_name: user.firstName + " " + (user.lastName || ""),
          email: user.emailAddresses[0]?.emailAddress,
          role: "sales", // Default role
        })
        .select()
        .single();

      if (createError) {
        console.error("Dashboard: Error creating profile:", {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code,
        });
      } else {
        console.log("Dashboard: Profile created -", newProfile?.id);
      }

      if (createError || !newProfile) {
        // Redirect to onboarding page instead of sign-in to prevent loop
        console.log("Dashboard: Redirecting to /onboarding");
        redirect("/onboarding");
      }

      return (
        <DashboardLayout user={newProfile}>
          <SalesDashboard />
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout user={profile}>
        {profile.role === "admin" && <AdminDashboard user={profile} />}
        {profile.role === "supervisor" && <SupervisorDashboard user={profile} />}
        {profile.role === "sales" && <SalesDashboard />}
      </DashboardLayout>
    );
  } catch (err) {
    console.error("Dashboard: Unexpected error:", err);
    redirect("/sign-in");
  }
}
