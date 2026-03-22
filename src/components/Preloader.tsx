import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Preloader() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background blurs matching the community page aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7e63f8]/5 rounded-full blur-[80px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#fbdd84]/10 rounded-full blur-[80px] animate-pulse [animation-delay:2s]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <div className="relative size-20">
          <div className="absolute inset-0 border-4 border-[#7e63f8]/20 rounded-full" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-[#7e63f8] border-t-transparent rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-6 text-[#7e63f8] animate-spin [animation-duration:3s]" />
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Loading Community...</h2>
          <p className="text-sm font-bold text-slate-400">Please wait while we fetch the latest updates.</p>
        </div>
      </motion.div>
    </div>
  );
}
