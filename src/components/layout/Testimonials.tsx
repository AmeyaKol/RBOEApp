import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

/**
 * Testimonials Section Component
 * 
 * Features:
 * - Student success stories with photos
 * - University placement highlights
 * - Star ratings for credibility
 * - Responsive grid layout
 */
export function Testimonials() {
  const testimonials = [
    {
      name: "Priya Sharma",
      previousCollege: "IIT Delhi",
      admittedTo: "Stanford University",
      program: "MS Computer Science",
      rating: 5,
      content: "The AI-powered SOP generation gave me the perfect starting point. My counselor helped me craft a compelling narrative that got me into my dream school!",
      image: "/api/placeholder/80/80" // Placeholder for student photo
    },
    {
      name: "Arjun Patel",
      previousCollege: "NIT Trichy", 
      admittedTo: "MIT",
      program: "MS Electrical Engineering",
      rating: 5,
      content: "From university selection to visa approval, every step was seamlessly managed. The personalized guidance made all the difference.",
      image: "/api/placeholder/80/80"
    },
    {
      name: "Sneha Reddy",
      previousCollege: "BITS Pilani",
      admittedTo: "Carnegie Mellon University",
      program: "MS Data Science",
      rating: 5,
      content: "The timeline management and deadline tracking features kept me organized throughout the entire application process. Highly recommended!",
      image: "/api/placeholder/80/80"
    },
    {
      name: "Rohit Kumar",
      previousCollege: "VIT Vellore",
      admittedTo: "University of California, Berkeley",
      program: "MS Mechanical Engineering", 
      rating: 5,
      content: "The mock visa interviews and document preparation were invaluable. I felt completely confident during my actual visa interview.",
      image: "/api/placeholder/80/80"
    },
    {
      name: "Ananya Singh",
      previousCollege: "Delhi University",
      admittedTo: "Harvard University",
      program: "MS Bioengineering",
      rating: 5,
      content: "The personalized university shortlist was spot-on. Every recommendation aligned perfectly with my research interests and career goals.",
      image: "/api/placeholder/80/80"
    },
    {
      name: "Vikram Joshi",
      previousCollege: "IIT Bombay",
      admittedTo: "Georgia Tech",
      program: "MS Computer Science",
      rating: 5,
      content: "The collaborative document editing feature allowed real-time feedback from my counselor. My SOP went through multiple iterations and became truly exceptional.",
      image: "/api/placeholder/80/80"
    }
  ];

  const universityLogos = [
    "Stanford", "MIT", "Harvard", "CMU", "UC Berkeley", "Georgia Tech", 
    "Cornell", "Columbia", "UCLA", "USC", "UT Austin", "UIUC"
  ];

  return (
    <section id="testimonials" className="py-20 sm:py-32 bg-background">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Success Stories from Our Students
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Real students, real results. See how RBOE helped them
            achieve their MS dreams at top universities.
          </p>
        </div>

        {/* University Logos Banner */}
        <div className="mt-12 mb-16">
          <p className="text-center text-sm font-semibold text-muted-foreground mb-6">
            Our students have been admitted to:
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 opacity-60">
            {universityLogos.map((university, index) => (
              <Badge key={index} variant="outline" className="text-xs px-3 py-1">
                {university}
              </Badge>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="mx-auto mt-16 grid max-w-6xl gap-8 lg:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <Quote className="h-8 w-8 text-primary mb-4" />
                
                {/* Testimonial Content */}
                <blockquote className="text-sm leading-relaxed text-muted-foreground mb-6">
                  &quot;{testimonial.content}&quot;
                </blockquote>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.previousCollege}</p>
                  </div>
                </div>

                {/* Admission Badge */}
                <div className="mt-4 pt-4 border-t">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    ✅ Admitted to {testimonial.admittedTo}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{testimonial.program}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Statistics Section */}
        <div className="mx-auto mt-20 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Successful Admits</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Top Universities</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Support Available</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 