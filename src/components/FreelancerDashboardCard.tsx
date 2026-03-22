import { Star } from "lucide-react";

const PRIMARY = "#7e63f8";
const SECONDARY = "#fbdd84";
const ACCENT = "#cbec93";

export interface QualityRow {
  label: string;
  stars: number;
  barWidth: string;
  barColor: string;
}

export interface FreelancerDashboardCardProps {
  onTimeDelivery: string;
  overallRating: string;
  successful: number;
  inProgress: number;
  pending: number;
  qualityRows: QualityRow[];
}

/**
 * Exact dashboard card from Leadership Board: metrics + Quality of Work Mastery.
 * Used in Leadership page and in client popup when viewing a freelancer.
 */
export const FreelancerDashboardCard = ({
  onTimeDelivery,
  overallRating,
  successful,
  inProgress,
  pending,
  qualityRows,
}: FreelancerDashboardCardProps) => {
  return (
    <div className="bg-white rounded-2xl md:rounded-[2rem] p-6 md:p-10 deep-soft-shadow border purple-border">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        <div className="lg:col-span-5 grid grid-cols-2 gap-6">
          <div>
            <p className="text-black/60 text-xs font-bold uppercase tracking-widest mb-1">On-Time Delivery %</p>
            <p className="text-black text-5xl md:text-6xl font-black tracking-tighter">
              {onTimeDelivery.replace("%", "")}
              <span className="text-2xl md:text-3xl text-primary">%</span>
            </p>
          </div>
          <div>
            <p className="text-black/60 text-xs font-bold uppercase tracking-widest mb-1">Overall Rating %</p>
            <p className="text-black text-5xl md:text-6xl font-black tracking-tighter">
              {overallRating.replace("%", "")}
              <span className="text-2xl md:text-3xl text-primary">%</span>
            </p>
          </div>
        </div>
        <div className="lg:col-span-7 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[120px] bg-primary/5 p-4 rounded-xl border purple-border">
            <p className="text-black/60 text-[10px] font-black uppercase mb-0.5">Successful</p>
            <p className="text-black text-3xl font-black">{successful}</p>
          </div>
          <div className="flex-1 min-w-[120px] bg-secondary/10 p-4 rounded-xl border border-secondary/20">
            <p className="text-black/60 text-[10px] font-black uppercase mb-0.5">In-Progress</p>
            <p className="text-black text-3xl font-black">{inProgress}</p>
          </div>
          <div className="flex-1 min-w-[120px] bg-accent/10 p-4 rounded-xl border border-accent/20">
            <p className="text-black/60 text-[10px] font-black uppercase mb-0.5">Pending</p>
            <p className="text-black text-3xl font-black">{pending}</p>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-primary/10 my-10" />

      <div>
        <h2 className="text-black text-xl font-black tracking-tight mb-6">Quality of Work Mastery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {qualityRows.map((row) => {
            const starCount = Math.min(5, Math.round(row.stars * 2) / 2);
            const fullStars = Math.floor(starCount);
            const hasHalf = starCount % 1 >= 0.25;
            return (
              <div key={row.label} className="flex flex-col gap-2">
                <p className="text-black font-bold text-base">{row.label}</p>
                <div className="flex gap-0.5 items-center">
                  {[1, 2, 3, 4, 5].map((i) => {
                    const filled = i <= fullStars;
                    const half = i === fullStars + 1 && hasHalf;
                    return (
                      <span key={i} className="relative inline-block h-5 w-5 shrink-0">
                        <Star
                          className="h-5 w-5 absolute inset-0"
                          style={{
                            color: filled || half ? SECONDARY : "rgba(126, 99, 248, 0.2)",
                            fill: filled ? SECONDARY : "transparent",
                          }}
                        />
                        {half && (
                          <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                            <Star className="h-5 w-5" style={{ color: SECONDARY, fill: SECONDARY }} />
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
                <div className="h-1.5 w-full bg-primary/5 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: row.barWidth, backgroundColor: row.barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const DEFAULT_QUALITY_ROWS: QualityRow[] = [
  { label: "Timeliness", stars: 4.5, barWidth: "90%", barColor: PRIMARY },
  { label: "Innovation", stars: 4.5, barWidth: "90%", barColor: SECONDARY },
  { label: "Conduct", stars: 3.5, barWidth: "70%", barColor: ACCENT },
  { label: "Accountability", stars: 4.5, barWidth: "90%", barColor: PRIMARY },
];
