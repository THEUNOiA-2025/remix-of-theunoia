import { Grid3X3, Briefcase, Gavel, Mail, User, Settings, LogOut, Users, CalendarDays, ShieldCheck, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppSidebarProps {
  onSignOut: () => void;
  currentPath: string;
  displayName: string;
  displayEmail: string;
  profilePictureUrl?: string | null;
  isVerifiedStudent?: boolean;
  unreadMessageCount?: number;
  isAdmin?: boolean;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Grid3X3, showForAll: true },
  { path: '/projects', label: 'Projects', icon: Briefcase, showForAll: true },
  { path: '/bids', label: 'My Bids', icon: Gavel, showForAll: true },
  { path: '/messages', label: 'Messages', icon: Mail, showForAll: true },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays, showForAll: true },
  { path: '/community', label: 'Community', icon: Users, showForAll: false },
  { path: '/buy-credits', label: 'Buy Credits', icon: Coins, showForAll: true },
  { path: '/profile', label: 'Profile', icon: User, showForAll: true },
];

export const AppSidebar = ({ 
  onSignOut, 
  currentPath, 
  displayName, 
  displayEmail, 
  profilePictureUrl,
  isVerifiedStudent = false,
  unreadMessageCount,
  isAdmin = false
}: AppSidebarProps) => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-card border-r border-border/60 p-5 flex flex-col justify-between fixed left-0 top-0 h-screen">
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="/images/theunoia-logo.png"
            alt="THEUNOiA Logo"
            className="h-10 object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="flex flex-col">
          {navItems.map((item) => {
            // Hide community item if user is not a verified student
            if (!item.showForAll && !isVerifiedStudent) {
              return null;
            }

            const Icon = item.icon;
            const isActive = currentPath === item.path;
            
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative ${
                  isActive
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'hover:bg-muted/30 text-muted-foreground hover:text-foreground font-medium rounded-xl'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                <p className="text-[0.9375rem]">{item.label}</p>
                {item.path === '/messages' && unreadMessageCount && unreadMessageCount > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                  </span>
                )}
              </a>
            );
        })}
        
        {/* Admin Panel Link */}
        {isAdmin && (
          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              navigate('/admin');
            }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all mt-4 border-t border-border/60 pt-4 ${
              currentPath.startsWith('/admin')
                ? 'bg-primary-light text-primary font-semibold'
                : 'hover:bg-muted/30 text-muted-foreground hover:text-foreground font-medium rounded-xl'
            }`}
          >
            <ShieldCheck className="w-[18px] h-[18px]" />
            <p className="text-[0.9375rem]">Admin Panel</p>
          </a>
        )}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col gap-3">
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/30 text-muted-foreground hover:text-foreground font-medium transition-all"
        >
          <Settings className="w-[18px] h-[18px]" />
          <p className="text-[0.9375rem]">Settings</p>
        </a>
        <div className="border-t border-border/60 my-1"></div>
        <div className="flex items-center gap-3 px-2">
          {profilePictureUrl ? (
            <img 
              src={profilePictureUrl} 
              alt="Profile" 
              className="aspect-square bg-cover rounded-full size-10 shadow-sm object-cover"
            />
          ) : (
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-gradient-to-br from-primary to-accent shadow-sm" />
          )}
          <div className="flex flex-col">
            <h1 className="text-foreground text-sm font-semibold">{displayName}</h1>
            <p className="text-muted-foreground text-xs">{displayEmail}</p>
          </div>
          <button 
            onClick={onSignOut}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
};
