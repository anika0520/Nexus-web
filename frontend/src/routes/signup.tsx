import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/Field";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create account — Nexus" }] }),
});

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email(),
  password: z.string().min(6, "Min 6 characters"),
});

function SignupPage() {
  const setAuth = useAppStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (d: z.infer<typeof schema>) => {
    try {
      const res = await authApi.signup({ name: d.name, email: d.email, password: d.password });
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome to Nexus, ${d.name.split(" ")[0]}!`);
      navigate({ to: "/app" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 gradient-mesh">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md glass-strong rounded-3xl p-8 shadow-[var(--shadow-elevated)]"
      >
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-xl gradient-primary grid place-items-center shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-semibold">Nexus</span>
        </Link>

        <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Start collaborating in under 30 seconds.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Field label="Full name" error={errors.name?.message}>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className={inputCls + " pl-10"} placeholder="Your name" {...register("name")} />
            </div>
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className={inputCls + " pl-10"} placeholder="you@company.com" {...register("email")} />
            </div>
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="password" className={inputCls + " pl-10"} placeholder="At least 6 chars" {...register("password")} />
            </div>
          </Field>

          <Button type="submit" variant="hero" size="lg" className="w-full mt-2 h-11 rounded-xl" disabled={isSubmitting}>
            {isSubmitting ? "Creating workspace…" : "Create workspace"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
