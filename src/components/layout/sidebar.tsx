"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  MapPin,
  ArrowUpCircle,
  ArrowDownCircle,
  Warehouse,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Separator } from "../ui/separator";
import logo from "../../../public/dr agenda.png";
import Image from "next/image";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Produtos",
    href: "/produtos",
    icon: Package,
  },
  {
    name: "Fornecedores",
    href: "/fornecedores",
    icon: Users,
  },
  {
    name: "Talhões",
    href: "/talhoes",
    icon: MapPin,
  },
  {
    name: "Entradas",
    href: "/entradas",
    icon: ArrowUpCircle,
  },
  {
    name: "Saídas",
    href: "/saidas",
    icon: ArrowDownCircle,
  },
  {
    name: "Estoque",
    href: "/estoque",
    icon: Warehouse,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-12 min-h-screen bg-green-50", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3">
          <div className="flex items-center justify-center">
            <Image src={logo} alt="logo" width={200} height={150} />
          </div>
          <Separator />
          <div className="mt-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    isActive
                      ? "bg-primary text-white hover:bg-primary hover:text-white"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0 bg-green-50">
        <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
        <div className="mt-2 px-3">
          <div className="flex items-center justify-center">
            <Image src={logo} alt="logo" width={200} height={150} />
          </div>
          <Separator />
          <div className="mt-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive
                    ? "bg-primary text-white hover:bg-primary hover:text-white"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
