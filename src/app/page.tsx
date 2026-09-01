"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardRoute } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/layout/Hero";
import { Services } from "@/components/layout/Services";
import { Footer } from "@/components/layout/Footer";
import { Loader2 } from "lucide-react";

const Testimonials = dynamic(() =>
  import("@/components/layout/Testimonials").then((mod) => mod.Testimonials)
);
const BookingForm = dynamic(() =>
  import("@/components/layout/BookingForm").then((mod) => mod.BookingForm)
);

/**
 * Landing Page - Project Constellation
 *
 * For authenticated users, redirects to the role dashboard.
 */
export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.profile) {
      const dashboardRoute = getDashboardRoute(user.profile.role);
      router.replace(dashboardRoute);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user?.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />

      <main>
        <Hero />
        <Services />
        <Testimonials />
        <BookingForm />
      </main>

      <Footer />
    </>
  );
}
