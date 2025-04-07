import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Users,
  CalendarCheck2,
  CreditCard,
  BarChart4,
  UserPlus,
  FileText
} from "lucide-react";

export default function QuickLinks() {
  const links = [
    {
      title: "Add Employee",
      icon: <UserPlus className="h-6 w-6" />,
      href: "/employees/add",
      bgColor: "bg-blue-100",
      textColor: "text-primary",
    },
    {
      title: "Mark Attendance",
      icon: <CalendarCheck2 className="h-6 w-6" />,
      href: "/attendance",
      bgColor: "bg-green-100",
      textColor: "text-secondary",
    },
    {
      title: "Process Salary",
      icon: <CreditCard className="h-6 w-6" />,
      href: "/salary",
      bgColor: "bg-yellow-100",
      textColor: "text-warning",
    },
    {
      title: "Generate Reports",
      icon: <BarChart4 className="h-6 w-6" />,
      href: "/reports",
      bgColor: "bg-purple-100",
      textColor: "text-accent",
    },
  ];

  return (
    <Card>
      <CardHeader className="px-6 py-4">
        <CardTitle className="text-lg font-semibold">Quick Links</CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {links.map((link, index) => (
            <Link key={index} href={link.href}>
              <a className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`h-12 w-12 ${link.bgColor} ${link.textColor} rounded-full flex items-center justify-center mb-3`}>
                  {link.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{link.title}</span>
              </a>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
