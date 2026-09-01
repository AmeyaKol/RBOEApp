"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Users, Award } from "lucide-react";

/**
 * Hero: primary landing message and CTAs — minimal, no decorative gradients.
 */
export function Hero() {
  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative border-b border-border bg-background py-20 sm:py-28">
      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your MS dream,{" "}
            <span className="text-primary">our mission</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Expert guidance, structured document support, and application
            strategy—without the noise.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 shrink-0 text-primary" />
              <span>500+ admits supported</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 shrink-0 text-primary" />
              <span>Strong US & global programs</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 shrink-0 text-primary" />
              <span>High-touch, limited cohort</span>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="h-auto px-8 py-6 text-base"
              onClick={scrollToContact}
            >
              Book consultation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="h-auto px-8 py-6 text-base" asChild>
              <a href="#services">Services</a>
            </Button>
            <Button variant="secondary" size="lg" className="h-auto px-8 py-6 text-base" asChild>
              <a href="/login">Login</a>
            </Button>
          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            Trusted by applicants from{" "}
            <span className="font-medium text-foreground">IIT, NIT, BITS</span>{" "}
            and other strong programs
          </p>
        </div>
      </div>
    </section>
  );
}
