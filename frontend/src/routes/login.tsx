import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/Field";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Nexus" }] }),
});

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});

function LoginPage() {
  const setAuth = useAppStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const fillAdmin = () => {
    setValue("email", "admin@nexus.com", { shouldValidate: true });
    setValue("password", "admin123", { shouldValidate: true });
  };

  const onSubmit = async (d: z.infer<typeof schema>) => {
    try {
      const res = await authApi.login({ email: d.email, password: d.password });
      setAuth(res.data.user, res.data.token);
      toast.success("Welcome back!");
      navigate({ to: "/app" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="h-9 w-9 rounded-xl gradient-primary grid place-items-center shadow-[var(--shadow-glow)]">
              <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-semibold">Nexus</span>
          </Link>

          <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Sign in to your workspace and pick up where you left off.
          </p>

          {/* Admin quick-fill */}
          <button
            type="button"
            onClick={fillAdmin}
            className="mt-6 w-full flex items-center justify-between p-3.5 rounded-xl border border-primary/25 bg-primary/5 hover:bg-primary/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-primary">Demo Admin Account</div>
                <div className="text-[11px] text-muted-foreground">admin@nexus.com · admin123</div>
              </div>
            </div>
            <span className="text-[11px] text-primary/50 group-hover:text-primary transition-colors font-medium">
              Click to fill →
            </span>
          </button>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            <Field label="Email" error={errors.email?.message}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input className={inputCls + " pl-10"} placeholder="you@company.com" {...register("email")} />
              </div>
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="password" className={inputCls + " pl-10"} placeholder="••••••••" {...register("password")} />
              </div>
            </Field>

            <Button type="submit" variant="hero" size="lg" className="w-full mt-2 h-11 rounded-xl" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            New to Nexus?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:block relative overflow-hidden border-l border-border">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute inset-0 bg-background/30" />
        <div className="relative h-full flex flex-col justify-center p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-strong rounded-2xl p-6 shadow-[var(--shadow-elevated)] max-w-md animate-float"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Active sprint</div>
                <div className="font-display text-lg font-semibold">Project Alpha</div>
              </div>
              <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-success/15 text-success border border-success/30">
                on track
              </span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "72%" }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="h-full gradient-primary"
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xl font-semibold">24</div>
                <div className="text-[11px] text-muted-foreground">Tasks</div>
              </div>
              <div>
                <div className="text-xl font-semibold">17</div>
                <div className="text-[11px] text-muted-foreground">Done</div>
              </div>
              <div>
                <div className="text-xl font-semibold">3</div>
                <div className="text-[11px] text-muted-foreground">Review</div>
              </div>
            </div>
          </motion.div>

          <div className="mt-12">
            <h2 className="font-display text-3xl font-semibold leading-tight max-w-md">
              Where teams ship{" "}
              <span className="gradient-text">extraordinary work</span>.
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-sm">
              Plan, track, and collaborate across projects with a workspace designed for clarity and speed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
