import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Building, Link } from "lucide-react";
import { Link as WouterLink } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        {children}
      </div>
      
      {/* Only show footer if user is not logged in */}
      {!user && (
        <footer className="bg-secondary/10 py-12 px-4">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">EMS Pro</span>
              </div>
              <p className="text-muted-foreground">
                Comprehensive employee management system for modern businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><WouterLink href="#" className="text-muted-foreground hover:text-primary">Features</WouterLink></li>
                <li><WouterLink href="#" className="text-muted-foreground hover:text-primary">Pricing</WouterLink></li>
                <li><WouterLink href="#" className="text-muted-foreground hover:text-primary">Integrations</WouterLink></li>
                <li><WouterLink href="#" className="text-muted-foreground hover:text-primary">Changelog</WouterLink></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><WouterLink href="#" className="text-muted-foreground hover:text-primary">Documentation</WouterLink></li>
                <li><WouterLink href="#" className="text-muted-foreground hover:text-primary">Blog</WouterLink></li>
                <li><WouterLink href="#" className="text-muted-foreground hover:text-primary">Support</WouterLink></li>
                <li><WouterLink href="#" className="text-muted-foreground hover:text-primary">API</WouterLink></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><WouterLink href="#" className="text-muted-foreground hover:text-primary">About</WouterLink></li>
                <li><WouterLink href="#" className="text-muted-foreground hover:text-primary">Careers</WouterLink></li>
                <li><WouterLink href="#" className="text-muted-foreground hover:text-primary">Contact</WouterLink></li>
                <li><WouterLink href="#" className="text-muted-foreground hover:text-primary">Privacy</WouterLink></li>
              </ul>
            </div>
          </div>
          
          <div className="container mx-auto mt-12 pt-6 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">
                &copy; {new Date().getFullYear()} EMS Pro. All rights reserved.
              </p>
              <div className="flex gap-4 mt-4 md:mt-0">
                <WouterLink href="#" className="text-muted-foreground hover:text-primary">Terms</WouterLink>
                <WouterLink href="#" className="text-muted-foreground hover:text-primary">Privacy</WouterLink>
                <WouterLink href="#" className="text-muted-foreground hover:text-primary">Cookies</WouterLink>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}