"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  University, 
  Plane, 
  Brain,
  CheckCircle,
  Target
} from "lucide-react";

/**
 * Services Section Component
 * 
 * Features:
 * - Grid layout of service cards
 * - Icons and descriptions for each service
 * - "How It Works" process flow
 * - Highlight key benefits with badges
 */
export function Services() {
  const services = [
    {
      icon: FileText,
      title: "SOP & LOR Crafting",
      description: "AI-powered document creation with personalized storytelling that showcases your unique journey and achievements.",
      features: ["AI-Generated Drafts", "Expert Review", "Multiple Versions", "Real-time Collaboration"],
      badge: "Most Popular"
    },
    {
      icon: University,
      title: "University Shortlisting",
      description: "Data-driven university recommendations based on your profile, preferences, and career goals.",
      features: ["Smart Matching", "Detailed Analytics", "Deadline Tracking", "Cost Analysis"],
      badge: "AI-Powered"
    },
    {
      icon: Plane,
      title: "Visa Preparation",
      description: "Complete visa documentation and interview preparation to ensure a smooth transition to your dream university.",
      features: ["Document Checklist", "Mock Interviews", "Embassy Guidance", "Timeline Management"],
      badge: "End-to-End"
    }
  ];

  const process = [
    {
      step: 1,
      title: "Profile Building",
      description: "Comprehensive assessment of your academic and professional background",
      icon: Target
    },
    {
      step: 2,
      title: "Document Crafting",
      description: "AI-assisted creation of compelling SOPs and LORs tailored to each university",
      icon: Brain
    },
    {
      step: 3,
      title: "Application Strategy",
      description: "Strategic university selection and application timeline management",
      icon: CheckCircle
    },
    {
      step: 4,
      title: "Visa Success",
      description: "Complete visa preparation and interview coaching for guaranteed success",
      icon: Plane
    }
  ];

  return (
    <section id="services" className="bg-muted/30 py-20 sm:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            MS application services
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From initial consultation to visa approval, we guide you through every step
            of your graduate school application journey.
          </p>
        </div>

        {/* Services Grid */}
        <div className="mx-auto mt-16 grid max-w-6xl gap-8 lg:grid-cols-3">
          {services.map((service, index) => (
            <Card key={index} className="relative overflow-hidden border border-border transition-colors hover:border-primary/40">
              {service.badge && (
                <Badge className="absolute right-4 top-4 bg-primary text-primary-foreground">
                  {service.badge}
                </Badge>
              )}
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="mx-auto mt-20 max-w-4xl">
          <div className="text-center">
            <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              How it works
            </h3>
            <p className="mt-4 text-muted-foreground">
              Our proven 4-step process that has helped 500+ students achieve their MS dreams
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {process.map((step, index) => (
              <div key={index} className="relative text-center">
                {/* Step Number */}
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {step.step}
                </div>
                
                {/* Icon */}
                <div className="mt-4 mx-auto flex h-8 w-8 items-center justify-center">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>

                {/* Content */}
                <h4 className="mt-4 text-lg font-semibold text-foreground">
                  {step.title}
                </h4>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Connector Line (except for last item) */}
                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full">
                    <div className="h-0.5 bg-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 