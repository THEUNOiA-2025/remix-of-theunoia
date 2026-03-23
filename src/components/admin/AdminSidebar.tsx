import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  ArrowLeft,
  FolderKanban,
  GraduationCap,
  FileText,
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { path: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { path: '/admin/colleges', label: 'Colleges', icon: GraduationCap },
  { path: '/admin/blogs', label: 'Blogs', icon: FileText },
  { path: '/admin/credits', label: 'Credits', icon: Coins },
];

export const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <div className="lg:hidden sticky top-0 z-40 bg-card border-b border-border px-3 py-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h1 className="font-semibold text-sm text-foreground">Admin Panel</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-card border-r border-border lg:flex flex-col z-50">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img src="/images/theunoia-logo.png" alt="THEUNOiA" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="font-bold text-lg text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">THEUNOiA</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Back to App */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to App
          </button>
        </div>
      </aside>
    </>
  );
};
