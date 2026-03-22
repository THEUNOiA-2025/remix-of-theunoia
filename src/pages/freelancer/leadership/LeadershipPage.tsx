import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const PRIMARY = "#7e63f8";
const SECONDARY = "#fbdd84";
const ACCENT = "#cbec93";

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  profile_picture_url: string | null;
  bio?: string | null;
}

/**
 * Leadership page – matches reference HTML exactly.
 * Hero (banner + avatar, name, description, badges), white card (metrics + Quality of Work Mastery), Global Standing with slanted cards.
 */
const LeadershipPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("first_name, last_name, profile_picture_url, bio")
        .eq("user_id", user.id)
        .single();

      console.log("User ID:", user?.id);
      console.log("Data:", data);
      console.log("Error:", error);

      if (error) throw error;
      setProfile(data ?? null);
    } catch {
      setProfile(null);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Avatar shows same profile_picture_url as Profile page (upload/remove only on Profile page)
  const displayName =
    profile?.first_name || profile?.last_name
      ? [profile.first_name, profile.last_name].filter(Boolean).join(" ").toUpperCase()
      : "ALEXANDER ELITE";
  const initials =
    profile?.first_name || profile?.last_name
      ? `${(profile.first_name || "")?.[0] || ""}${(profile.last_name || "")?.[0] || ""}`.toUpperCase()
      : "AE";
  const description =
    profile?.bio ||
    "Expert Full-Stack Strategist specializing in ultra-premium digital ecosystems. Leading the next generation of creative leadership within THEUNOiA network.";

  const qualityRows = [
    { label: "Timeliness", stars: 5, barWidth: "100%", barColor: PRIMARY },
    { label: "Innovation", stars: 5, barWidth: "95%", barColor: SECONDARY },
    { label: "Conduct", stars: 4, barWidth: "80%", barColor: ACCENT },
    { label: "Accountability", stars: 5, barWidth: "100%", barColor: PRIMARY },
  ];

  const top10Ranking = [
    { rank: 1, name: "Alexander Elite", onTime: "99.8%", rating: "100%", performance: "Legendary", rankBadge: "bg-secondary border-secondary/30", avatarBorder: "border-primary", perfBadge: "bg-primary/10 text-primary border-primary/20" },
    { rank: 2, name: "Sarah Morgan", onTime: "98.2%", rating: "99.5%", performance: "Pioneer", rankBadge: "bg-gray-200 border-gray-300", avatarBorder: "border-secondary/50", perfBadge: "bg-primary/20 text-primary border-primary/30" },
    { rank: 3, name: "Julian Voss", onTime: "97.9%", rating: "99.0%", performance: "Elite", rankBadge: "bg-accent/30 border-accent/50", avatarBorder: "border-accent/50", perfBadge: "bg-blue-100 text-blue-700 border-blue-200" },
    { rank: 4, name: "Maya Chen", onTime: "97.5%", rating: "98.8%", performance: "Elite", rankBadge: "bg-primary/10 border-primary/20", avatarBorder: "border-primary/20", perfBadge: "bg-primary/10 text-primary border-primary/20" },
    { rank: 5, name: "James Wright", onTime: "97.2%", rating: "98.5%", performance: "Pioneer", rankBadge: "bg-primary/10 border-primary/20", avatarBorder: "border-primary/20", perfBadge: "bg-primary/20 text-primary border-primary/30" },
    { rank: 6, name: "Elena Rossi", onTime: "96.9%", rating: "98.2%", performance: "Elite", rankBadge: "bg-primary/10 border-primary/20", avatarBorder: "border-primary/20", perfBadge: "bg-primary/10 text-primary border-primary/20" },
    { rank: 7, name: "David Kim", onTime: "96.5%", rating: "98.0%", performance: "Elite", rankBadge: "bg-primary/10 border-primary/20", avatarBorder: "border-primary/20", perfBadge: "bg-primary/10 text-primary border-primary/20" },
    { rank: 8, name: "Olivia Brown", onTime: "96.2%", rating: "97.8%", performance: "Elite", rankBadge: "bg-primary/10 border-primary/20", avatarBorder: "border-primary/20", perfBadge: "bg-primary/10 text-primary border-primary/20" },
    { rank: 9, name: "Liam Foster", onTime: "95.8%", rating: "97.5%", performance: "Elite", rankBadge: "bg-primary/10 border-primary/20", avatarBorder: "border-primary/20", perfBadge: "bg-primary/10 text-primary border-primary/20" },
    { rank: 10, name: "Zara Ahmed", onTime: "95.5%", rating: "97.2%", performance: "Elite", rankBadge: "bg-primary/10 border-primary/20", avatarBorder: "border-primary/20", perfBadge: "bg-primary/10 text-primary border-primary/20" },
  ];

  return (
    <div className="relative flex flex-col w-full overflow-x-hidden font-display min-h-screen text-black">
      <main className="w-full">
        {/* Hero – full width, slightly reduced height */}
        <section className="w-full bg-black relative overflow-hidden min-h-[300px] flex items-end">
          <div className="absolute inset-0 leadership-banner-mask" aria-hidden />
          <div className="max-w-[1200px] mx-auto w-full px-6 md:px-8 pt-6 pb-14 relative z-10 flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <Avatar className="size-24 rounded-full border-2 border-white/20 overflow-hidden bg-slate-700 ring-2 ring-white">
                <AvatarImage src={profile?.profile_picture_url ?? undefined} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-primary text-white text-lg font-black">{initials}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col justify-center text-white">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-0.5 uppercase leading-tight">{displayName}</h1>
              <p className="text-white/80 text-[11px] md:text-xs max-w-lg leading-snug font-medium">{description}</p>
            </div>
          </div>
        </section>

        <div className="max-w-[1200px] mx-auto px-6 md:px-8">
          {/* White card – slightly reduced padding */}
          <div className="bg-white rounded-2xl md:rounded-[2rem] p-6 md:p-10 deep-soft-shadow border purple-border -mt-8 relative z-20 mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-5 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-black/60 text-xs font-bold uppercase tracking-widest mb-1">On-Time Delivery %</p>
                  <p className="text-black text-5xl md:text-6xl font-black tracking-tighter">99.8<span className="text-2xl md:text-3xl text-primary">%</span></p>
                </div>
                <div>
                  <p className="text-black/60 text-xs font-bold uppercase tracking-widest mb-1">Overall Rating %</p>
                  <p className="text-black text-5xl md:text-6xl font-black tracking-tighter">100<span className="text-2xl md:text-3xl text-primary">%</span></p>
                </div>
              </div>
              <div className="lg:col-span-7 flex flex-wrap gap-3">
                <div className="flex-1 min-w-[120px] bg-primary/5 p-4 rounded-xl border purple-border">
                  <p className="text-black/60 text-[10px] font-black uppercase mb-0.5">Successful</p>
                  <p className="text-black text-3xl font-black">142</p>
                </div>
                <div className="flex-1 min-w-[120px] bg-secondary/10 p-4 rounded-xl border border-secondary/20">
                  <p className="text-black/60 text-[10px] font-black uppercase mb-0.5">In-Progress</p>
                  <p className="text-black text-3xl font-black">8</p>
                </div>
                <div className="flex-1 min-w-[120px] bg-accent/10 p-4 rounded-xl border border-accent/20">
                  <p className="text-black/60 text-[10px] font-black uppercase mb-0.5">Pending</p>
                  <p className="text-black text-3xl font-black">3</p>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-primary/10 my-10" />

            <div>
              <h2 className="text-black text-xl font-black tracking-tight mb-6">Quality of Work Mastery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {qualityRows.map((row) => (
                  <div key={row.label} className="flex flex-col gap-2">
                    <p className="text-black font-bold text-base">{row.label}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 shrink-0"
                          style={{ color: i <= row.stars ? SECONDARY : "rgba(126, 99, 248, 0.2)", fill: i <= row.stars ? SECONDARY : "transparent" }}
                        />
                      ))}
                    </div>
                    <div className="h-1.5 w-full bg-primary/5 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: row.barWidth, backgroundColor: row.barColor }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 10 Ranking – table exactly like reference image */}
          <section className="mb-12">
            <h2 className="text-black text-2xl font-black tracking-tighter mb-6">Top 10 Ranking</h2>
            <div className="overflow-hidden bg-white rounded-2xl border purple-border card-shadow">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary/5">
                    <th className="px-4 md:px-6 py-3 text-black/60 text-xs font-bold uppercase tracking-widest">Rank</th>
                    <th className="px-4 md:px-6 py-3 text-black/60 text-xs font-bold uppercase tracking-widest">Freelancer</th>
                    <th className="px-4 md:px-6 py-3 text-black/60 text-xs font-bold uppercase tracking-widest text-center">On-Time</th>
                    <th className="px-4 md:px-6 py-3 text-black/60 text-xs font-bold uppercase tracking-widest text-center">Rating</th>
                    <th className="px-4 md:px-6 py-3 text-black/60 text-xs font-bold uppercase tracking-widest text-right">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {top10Ranking.map((row) => (
                    <tr key={row.rank} className="hover:bg-primary/[0.02] transition-colors">
                      <td className="px-4 md:px-6 py-3">
                        <div className={`inline-flex size-9 md:size-10 items-center justify-center rounded-lg border font-black text-black text-sm md:text-base ${row.rankBadge}`}>
                          {row.rank}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className={`size-9 md:size-10 rounded-full border-2 overflow-hidden ${row.avatarBorder}`}>
                            <AvatarFallback className="text-xs font-bold bg-slate-200 text-black">{row.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-black">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-center font-semibold text-black">{row.onTime}</td>
                      <td className="px-4 md:px-6 py-3 text-center font-semibold text-black">{row.rating}</td>
                      <td className="px-4 md:px-6 py-3 text-right">
                        <span className={`inline-flex px-3 py-1 rounded-lg border text-xs font-black uppercase ${row.perfBadge}`}>
                          {row.performance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LeadershipPage;
