import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  CreditCard,
  BarChart,
  Building2,
  Award,
  UserCog,
  Clock,
  LogOut,
  UserCircle,
  MapPin,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type NavItemProps = {
  icon: React.ReactNode;
  href: string;
  label: string;
  currentPath: string;
};

function NavItem({ icon, href, label, currentPath }: NavItemProps) {
  const isActive = currentPath === href || 
                   (href !== '/' && currentPath.startsWith(href));

  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors",
          isActive 
            ? "bg-primary/10 text-primary border-l-3 border-primary"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <span className="mr-2">{icon}</span>
        {label}
      </a>
    </Link>
  );
}

type SidebarProps = {
  isOpen: boolean;
  closeSidebar: () => void;
};

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside 
      className={cn(
        "w-64 bg-white border-r border-gray-200 transition-all duration-300",
        !isOpen && "lg:ml-0 -ml-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="ml-2 font-semibold text-gray-800">EMS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={closeSidebar} className="lg:hidden">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || '?'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2 space-y-6">
        <div className="space-y-1">
          <p className="pl-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Main</p>
          <NavItem
            icon={<LayoutDashboard size={18} />}
            href="/dashboard"
            label="Dashboard"
            currentPath={location}
          />
          <NavItem
            icon={<Users size={18} />}
            href="/employees"
            label="Employees"
            currentPath={location}
          />
          <NavItem
            icon={<Calendar size={18} />}
            href="/attendance"
            label="Attendance"
            currentPath={location}
          />
          <NavItem
            icon={<FileText size={18} />}
            href="/leave-management"
            label="Leave Management"
            currentPath={location}
          />
          <NavItem
            icon={<CreditCard size={18} />}
            href="/salary"
            label="Salary Management"
            currentPath={location}
          />
          <NavItem
            icon={<BarChart size={18} />}
            href="/reports"
            label="Reports"
            currentPath={location}
          />
        </div>

        <div className="space-y-1">
          <p className="pl-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Configuration</p>
          <NavItem
            icon={<Building2 size={18} />}
            href="/configuration/departments"
            label="Departments"
            currentPath={location}
          />
          <NavItem
            icon={<Award size={18} />}
            href="/configuration/designations"
            label="Designations"
            currentPath={location}
          />
          <NavItem
            icon={<UserCog size={18} />}
            href="/configuration/employee-types"
            label="Employee Types"
            currentPath={location}
          />
          <NavItem
            icon={<Clock size={18} />}
            href="/configuration/shifts"
            label="Shifts"
            currentPath={location}
          />
          <NavItem
            icon={<FileText size={18} />}
            href="/configuration/leave-types"
            label="Leave Types"
            currentPath={location}
          />
          <NavItem
            icon={<MapPin size={18} />}
            href="/configuration/locations"
            label="Locations/Branches"
            currentPath={location}
          />
        </div>
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-center"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut size={18} className="mr-2" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </aside>
  );
}
