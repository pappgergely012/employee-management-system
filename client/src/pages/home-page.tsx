import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle, Users, Clock, Calendar, LineChart, Building, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <header className="container mx-auto py-6 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">EMS Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/auth">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/auth">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto py-16 px-4 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Simplify</span> your HR operations
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Comprehensive employee management solution for modern businesses. Track attendance, manage leave requests, handle payroll, and more - all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/auth">Get Started <ChevronRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline">
                Book a Demo
              </Button>
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 p-6 shadow-xl">
            <img 
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
              alt="Employee Management Dashboard" 
              className="rounded-md w-full shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Comprehensive HR Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <Users className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Employee Management</h3>
            <p className="text-muted-foreground">
              Maintain detailed employee records, track performance, and manage department assignments.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <Clock className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Attendance Tracking</h3>
            <p className="text-muted-foreground">
              Track clock-in/out times, monitor working hours, and generate attendance reports.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <Calendar className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Leave Management</h3>
            <p className="text-muted-foreground">
              Process leave requests, track balances, and maintain a company-wide leave calendar.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <LineChart className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Reporting & Analytics</h3>
            <p className="text-muted-foreground">
              Generate custom reports on attendance, leave, departmental performance, and more.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <Building className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Organizational Charts</h3>
            <p className="text-muted-foreground">
              Create and manage interactive org charts with drag-and-drop capabilities.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <CheckCircle className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Salary Management</h3>
            <p className="text-muted-foreground">
              Manage employee compensation, generate payslips, and track salary history.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto py-16 px-4 bg-secondary/5 rounded-xl">
        <h2 className="text-3xl font-bold text-center mb-4">Pricing Plans</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Choose the perfect plan for your business needs. All plans include access to core features with pricing based on employee count.
        </p>
        
        <Tabs defaultValue="monthly" className="max-w-4xl mx-auto">
          <TabsList className="grid w-[300px] grid-cols-2 mx-auto mb-8">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly (20% off)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-2 border-border hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>For small businesses</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">$4</span>
                    <span className="text-muted-foreground"> / employee / month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Up to 25 employees</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Employee management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Attendance tracking</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Basic reports</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Choose Plan</Button>
                </CardFooter>
              </Card>
              
              <Card className="border-2 border-primary shadow-lg relative">
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
                <CardHeader>
                  <CardTitle>Business</CardTitle>
                  <CardDescription>For growing companies</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">$3</span>
                    <span className="text-muted-foreground"> / employee / month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>26-100 employees</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>All Starter features</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Leave management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Salary management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Organizational charts</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="default">Choose Plan</Button>
                </CardFooter>
              </Card>
              
              <Card className="border-2 border-border hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>For large organizations</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">$2</span>
                    <span className="text-muted-foreground"> / employee / month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>100+ employees</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>All Business features</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Advanced reporting</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>API access</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Dedicated support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Contact Sales</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="yearly">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-2 border-border hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>For small businesses</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">$3.20</span>
                    <span className="text-muted-foreground"> / employee / month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Up to 25 employees</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Employee management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Attendance tracking</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Basic reports</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Choose Plan</Button>
                </CardFooter>
              </Card>
              
              <Card className="border-2 border-primary shadow-lg relative">
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
                <CardHeader>
                  <CardTitle>Business</CardTitle>
                  <CardDescription>For growing companies</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">$2.40</span>
                    <span className="text-muted-foreground"> / employee / month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>26-100 employees</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>All Starter features</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Leave management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Salary management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Organizational charts</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="default">Choose Plan</Button>
                </CardFooter>
              </Card>
              
              <Card className="border-2 border-border hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>For large organizations</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">$1.60</span>
                    <span className="text-muted-foreground"> / employee / month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>100+ employees</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>All Business features</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Advanced reporting</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>API access</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Dedicated support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Contact Sales</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Contact/CTA Section */}
      <section className="container mx-auto py-16 px-4 mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your HR operations?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of companies that use EMS Pro to manage their workforce efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth">Start your free trial</Link>
            </Button>
            <Button size="lg" variant="outline">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer moved to AppLayout component */}
    </div>
  );
}