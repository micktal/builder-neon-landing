import { Link, NavLink } from "react-router-dom";
import { ReactNode } from "react";
import {
  Grid2X2,
  Search,
  Building2,
  GraduationCap,
  FileText,
  BarChart3,
  BookOpen,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "./ThemeToggle";

const FPSG_LOGO_URL =
  "https://cdn.builder.io/api/v1/image/assets%2Fd93d9a0ec7824aa1ac4d890a1f90a2ec%2Fef588347db774ea5a9418f8ecbbd8909?format=webp&width=120";

interface Props {
  children: ReactNode;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:text-foreground hover:bg-accent"
  }`;

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={FPSG_LOGO_URL} alt="FPSG" className="h-8 w-auto" />
            <div className="leading-tight">
              <div className="font-bold tracking-tight">
                FPSG Prospection Assistant
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" className={navLinkClass}>
              <Grid2X2 className="h-4 w-4" /> Dashboard
            </NavLink>
            <NavLink to="/nouvelle-recherche" className={navLinkClass}>
              <Search className="h-4 w-4" /> Nouvelle recherche
            </NavLink>
            <NavLink to="/prospects" className={navLinkClass}>
              <Building2 className="h-4 w-4" /> Prospects
            </NavLink>
            <NavLink to="/formations" className={navLinkClass}>
              <GraduationCap className="h-4 w-4" /> Formations
            </NavLink>
            <NavLink to="/templates" className={navLinkClass}>
              <FileText className="h-4 w-4" /> Templates
            </NavLink>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent">
                <MoreHorizontal className="h-4 w-4" /> Plus
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    to="/analytics"
                    className="inline-flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" /> Analytics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/espace-formation-interne"
                    className="inline-flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" /> Espace interne
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="container py-6 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <img src={FPSG_LOGO_URL} alt="FPSG" className="h-4 w-auto" /> ©{" "}
            {new Date().getFullYear()} FPSG • Groupe Fiducial
          </span>
          <nav className="flex items-center gap-4">
            <Link
              to="/legal"
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              Mentions légales
            </Link>
            <Link
              to="/privacy"
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              Confidentialité
            </Link>
            <Link
              to="/support"
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              Support
            </Link>
          </nav>
          <span>Interne — Outil d'aide à la prospection</span>
        </div>
      </footer>
    </div>
  );
}
