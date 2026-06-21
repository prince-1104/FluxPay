"use client";

import { useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { TrendingUp, Users, Wallet } from "lucide-react";

const stats = [
  {
    label: "Total spent",
    value: "$12,450",
    icon: Wallet,
    gradient: "from-emerald-500/30 to-teal-400/10",
    text: "text-emerald-300",
    glow: "bg-emerald-500/20",
    z: 48,
  },
  {
    label: "Active trips",
    value: "3",
    icon: Users,
    gradient: "from-violet-500/30 to-purple-400/10",
    text: "text-violet-300",
    glow: "bg-violet-500/20",
    z: 64,
  },
  {
    label: "Pending",
    value: "$2,100",
    icon: TrendingUp,
    gradient: "from-amber-500/30 to-orange-400/10",
    text: "text-amber-300",
    glow: "bg-amber-500/20",
    z: 56,
  },
] as const;

const chartBars = [52, 78, 45, 92, 68, 85, 58, 74];

export function DashboardPreview3D() {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(10, { stiffness: 120, damping: 18 });
  const rotateY = useSpring(-14, { stiffness: 120, damping: 18 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      rotateY.set(x * 22 - 14);
      rotateX.set(-y * 18 + 10);
    },
    [rotateX, rotateY],
  );

  const handleMouseLeave = useCallback(() => {
    rotateX.set(10);
    rotateY.set(-14);
  }, [rotateX, rotateY]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-16 max-w-4xl px-2"
      style={{ perspective: "1400px" }}
    >
      <div
        className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-gradient-to-r from-brand/25 via-transparent to-gold/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/4 top-1/3 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl animate-glow-drift"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl animate-glow-drift-reverse"
        aria-hidden
      />

      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="preview-3d-scene relative"
      >
        <div
          className="absolute inset-0 rounded-[1.75rem] border border-white/10 bg-black/40 shadow-2xl shadow-black/60"
          style={{ transform: "translateZ(-40px) scale(0.96)" }}
          aria-hidden
        />

        <div
          className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-surface/90 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          style={{ transform: "translateZ(0px)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-brand/5 pointer-events-none" />

          <div className="relative border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/90 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <div className="h-3 w-3 rounded-full bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/90 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            </div>
            <div className="mt-3 h-2 w-32 rounded-full bg-white/10" />
          </div>

          <div className="relative p-5 md:p-6" style={{ transformStyle: "preserve-3d" }}>
            <div className="grid gap-4 md:grid-cols-3">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 24, rotateX: -20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ delay: 0.45 + i * 0.12, duration: 0.6 }}
                    className="preview-3d-card group relative"
                    style={{ transform: `translateZ(${stat.z}px)` }}
                  >
                    <div
                      className={`absolute -inset-px rounded-2xl opacity-60 blur-md transition-opacity duration-300 group-hover:opacity-100 ${stat.glow}`}
                      aria-hidden
                    />
                    <div
                      className={`relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br ${stat.gradient} p-4 backdrop-blur-md`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                            {stat.label}
                          </p>
                          <p className={`mt-1.5 text-2xl font-bold tracking-tight ${stat.text}`}>
                            {stat.value}
                          </p>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                          <Icon className={`h-4 w-4 ${stat.text}`} />
                        </div>
                      </div>
                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${stat.gradient}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${55 + i * 15}%` }}
                          transition={{ delay: 0.8 + i * 0.1, duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, rotateX: 24 }}
              animate={{ opacity: 1, rotateX: 12 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="preview-3d-chart mt-5 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 md:p-5"
              style={{ transform: "translateZ(32px) rotateX(12deg)", transformStyle: "preserve-3d" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-400">Spending trend</p>
                  <p className="text-sm font-semibold text-white">Last 7 days</p>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  +18%
                </span>
              </div>

              <div
                className="flex h-28 items-end justify-between gap-1.5 md:gap-2.5 md:px-1"
                style={{ transformStyle: "preserve-3d", perspective: "600px" }}
              >
                {chartBars.map((height, i) => (
                  <motion.div
                    key={i}
                    className="preview-3d-bar relative flex-1 origin-bottom"
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ delay: 0.9 + i * 0.06, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{
                      height: `${height}%`,
                      transform: `translateZ(${i * 3}px)`,
                    }}
                  >
                    <div className="preview-3d-bar-face h-full w-full rounded-t-lg bg-gradient-to-t from-brand via-brand-light to-violet-300 shadow-[0_-4px_20px_rgba(124,58,237,0.35)]" />
                    <div className="preview-3d-bar-top absolute left-0 top-0 h-2 w-full rounded-t-lg bg-violet-200/40" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -right-2 top-8 hidden rounded-xl border border-white/15 bg-surface-elevated/90 px-3 py-2 shadow-xl backdrop-blur-md md:block"
              style={{ transform: "translateZ(80px) rotateY(-8deg)" }}
            >
              <p className="text-[10px] text-neutral-500">Settled</p>
              <p className="text-sm font-bold text-emerald-400">$4,200</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
