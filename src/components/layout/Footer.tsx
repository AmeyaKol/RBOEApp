"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Twitter, 
  Instagram,
  ArrowRight 
} from "lucide-react";

/**
 * Footer Component for the Landing Page
 * 
 * Features:
 * - Company information and contact details
 * - Navigation links and social media
 * - Newsletter signup
 * - Copyright and legal links
 */
export function Footer() {
  const quickLinks = [
    { label: "Services", href: "#services" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Contact", href: "#contact" },
    { label: "Student Login", href: "/login" },
  ];

  const services = [
    { label: "SOP Writing", href: "#services" },
    { label: "LOR Assistance", href: "#services" },
    { label: "University Selection", href: "#services" },
    { label: "Visa Preparation", href: "#services" },
  ];

  const socialLinks = [
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container">
        <div className="py-14">
          <div className="grid gap-10 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link href="/" className="mb-4 inline-block">
                <span className="font-display text-xl font-semibold tracking-tight text-foreground">
                  Rajiv Bose Overseas Education
                </span>
              </Link>
              <p className="mb-6 max-w-md text-muted-foreground">
                Graduate admissions counseling with a focused cohort, clear process, and
                practical support from shortlist to visa.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <a
                    href="mailto:rb.overseasedu@gmail.com"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    rb.overseasedu@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <a
                    href="tel:+917558589290"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    75585 89290
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    Pune, Maharashtra, India
                  </span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3 mt-6">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="flex items-center justify-center w-9 h-9 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                Quick links
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    {link.href.startsWith("#") ? (
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-muted-foreground hover:text-primary transition-colors text-sm"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link 
                        href={link.href}
                        className="text-muted-foreground hover:text-primary transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                Services
              </h3>
              <ul className="space-y-3">
                {services.map((service, index) => (
                  <li key={index}>
                    <button
                      onClick={() => scrollToSection(service.href)}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {service.label}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Newsletter Signup */}
              <div className="mt-8">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Stay updated</h4>
                <p className="text-muted-foreground text-sm mb-3">
                  Get the latest tips and updates on MS applications
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded-md"
                  />
                  <Button size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-border py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Rajiv Bose Overseas Education. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link 
                href="/privacy" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                href="/cookies" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 