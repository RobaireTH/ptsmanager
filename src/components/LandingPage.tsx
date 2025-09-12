import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, Award, Globe, ArrowRight, Star, Check, GraduationCap, Heart, Lightbulb } from 'lucide-react';
import studentsImage from './assets/a9fb3a683259798a4a27feea2731b90f66e5a88e.png';
import principalImage from './assets/fe6e122429d57d168f64cd786cf3c0b44ef59f7d.png';
import studentWritingImage from './assets/966bf5b2d0b1a0e63e316fbc22addb3f9debde63.png';
import schoolLogo from './assets/6c5b559c47b3a60a366fb3371a7065b4c91fe552.png';
import { SchoolGallery } from './SchoolGallery';

import { useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  const achievements = [
    { number: "1,485", label: "Active Students", icon: Users },
    { number: "52", label: "Dedicated Teachers", icon: GraduationCap },
    { number: "95%", label: "Parent Engagement", icon: Award },
    { number: "24/7", label: "Dashboard Access", icon: Star }
  ];

  const values = [
    {
      icon: Heart,
      title: "Collaborative Monitoring",
      description: "Real-time tracking of student progress through seamless communication between parents and teachers."
    },
    {
      icon: Lightbulb,
      title: "Data-Driven Insights",
      description: "Comprehensive analytics and reports that illuminate student growth patterns and learning achievements."
    },
    {
      icon: Globe,
      title: "Holistic Development",
      description: "Monitoring academic, social, and emotional growth to ensure well-rounded student development."
    }
  ];

  const programs = [
    {
      level: "Parent Dashboard Features",
      description: "Comprehensive tools for parents to monitor their child's academic progress and school activities.",
      features: ["Real-time Grade Tracking", "Attendance Monitoring", "Assignment Updates", "Teacher Communications"]
    },
    {
      level: "Teacher Dashboard Features", 
      description: "Professional tools for educators to manage classrooms and communicate with parents effectively.",
      features: ["Student Assessment Tools", "Parent Communication Hub", "Progress Report Generation", "Behavioral Tracking"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm fixed w-full top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src={schoolLogo} 
              alt="Faith-Life International College Logo" 
              className="h-10 w-10 logo-blend header-logo" 
            />
            <div>
              <h1 className="text-xl font-bold text-primary">Faith-Life International College</h1>
              <p className="text-xs text-muted-foreground">Excellence in Education</p>
            </div>
          </div>
          <Button onClick={onGetStarted} className="flex items-center gap-2">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `linear-gradient(rgba(29, 78, 216, 0.8), rgba(30, 58, 138, 0.8)), url(${studentsImage})` 
          }}
        />
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Parent-Teacher Dashboard<br />
            <span className="text-secondary">Tracking Student Growth</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Empowering collaboration between parents and teachers to monitor, support, and celebrate 
            every student's academic journey and personal development in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onGetStarted} size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Access Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-primary text-primary bg-white/90 hover:bg-primary hover:text-white backdrop-blur-sm"
              onClick={() => setIsGalleryOpen(true)}
            >
              View School Campus
            </Button>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <Card key={index} className="text-center border-none shadow-lg">
                <CardContent className="p-6">
                  <achievement.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-primary mb-2">{achievement.number}</h3>
                  <p className="text-muted-foreground">{achievement.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Principal's Message */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Platform Overview</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
                Welcome to Our Parent-Teacher Dashboard
              </h2>
              <blockquote className="text-lg text-muted-foreground mb-8 leading-relaxed italic">
                "Our integrated dashboard system bridges the gap between home and school, providing parents and teachers 
                with real-time insights into student progress. Together, we create a supportive ecosystem that nurtures 
                every child's academic journey and personal growth through transparent communication and data-driven decisions."
              </blockquote>
              <div>
                <p className="font-semibold text-primary">Dr. Folake Adeyemi</p>
                <p className="text-muted-foreground">Principal, Faith-Life International College</p>
                <p className="text-sm text-muted-foreground mt-2">PhD Education Administration, Digital Learning Advocate</p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={principalImage} 
                  alt="Principal Dr. Folake Adeyemi" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-secondary text-secondary-foreground p-4 rounded-xl shadow-lg">
                <p className="font-bold">15+ Years</p>
                <p className="text-sm">Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Dashboard Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
              Empowering Student Growth Together
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive dashboard connects parents and teachers with powerful tools to track, 
              support, and celebrate every milestone in a student's educational journey.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <value.icon className="h-16 w-16 text-primary mx-auto mb-6" />
                  <h3 className="text-xl font-bold mb-4 text-primary">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Programs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={studentWritingImage} 
                  alt="Student focused on learning" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-6 -left-6 bg-primary text-primary-foreground p-4 rounded-xl shadow-lg">
                <p className="font-bold">Parent & Teacher</p>
                <p className="text-sm">Dashboards</p>
              </div>
            </div>
            <div>
              <Badge className="mb-4">Platform Capabilities</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
                Comprehensive Dashboard System
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our integrated platform provides specialized dashboards for both parents and teachers, 
                fostering collaboration and transparency in tracking student development and academic achievements.
              </p>
              <div className="space-y-6">
                {programs.map((program, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <CardTitle className="text-lg text-primary">{program.level}</CardTitle>
                      <CardDescription>{program.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {program.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-secondary" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Student Growth Tracking?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of parents and teachers already using our dashboard to collaborate, 
            communicate, and celebrate student achievements together.
          </p>
          <Button 
            onClick={onGetStarted} 
            size="lg" 
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            Start Using Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src={schoolLogo} 
                  alt="Faith-Life International College Logo" 
                  className="h-6 w-6 logo-blend footer-logo" 
                />
                <span className="font-bold text-primary">Faith-Life International College</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Connecting parents and teachers through innovative dashboard technology to track and support student growth in real-time.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-primary">Quick Links</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Parent Dashboard</li>
                <li>Teacher Portal</li>
                <li>Student Progress</li>
                <li>Communication Hub</li>
                <li>Reports & Analytics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-primary">Contact Information</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>Lagos, Nigeria</p>
                <p>Phone: +234 (0) 1 234 5678</p>
                <p>Email: info@faith-life.edu.ng</p>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Faith-Life International College. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* School Gallery */}
      <SchoolGallery isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
    </div>
  );
}
