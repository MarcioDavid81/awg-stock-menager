"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Package,
  Users,
  Warehouse,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import logo from "../../../public/dr agenda.png";
import { Separator } from "../ui/separator";
import { useUser } from "@/contexts/user-context";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await apiService.logout();
      toast.success("Sair realizado com sucesso!");
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao sair. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "pb-12 min-h-screen bg-green-50 flex flex-col justify-between",
        className
      )}
    >
      <div className="space-y-4 py-4">
        <div className="px-3">
          <div className="flex items-center justify-center">
            <Link href="/">
              <Image src={logo} alt="logo" width={200} height={150} />
            </Link>
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
      <Separator />
      <div className="px-3">
        <div className="flex items-center justify-center mb-4 space-x-4">
          <Avatar>
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback>{user?.name?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
          </Avatar>
          <span>{user?.name}</span>
        </div>
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {loading ? <Loader2 className="animate-spin" /> : "Sair"}
        </Button>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex flex-col justify-between">
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
    </div>
  );
}
