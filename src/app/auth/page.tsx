"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) throw error;
        toast.success("Account created! Let's set up your languages.");
        router.push("/onboarding");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 pt-safe pb-safe">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col gap-6"
      >
        {/* Logo */}
        <div className="text-center">
          <div className="text-5xl mb-3">📸</div>
          <h1 className="text-3xl font-bold">
            <span style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 280), oklch(0.72 0.18 310))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Lingvido
            </span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Learn languages with your camera</p>
        </div>

        {/* Mode toggle */}
        <div className="glass rounded-2xl p-1 flex">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === m ? "gradient-primary text-white" : "text-muted-foreground"
              }`}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              minLength={3}
              className="glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors placeholder:text-muted-foreground"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="glass rounded-2xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-semibold text-white gradient-primary glow-purple transition-transform active:scale-95 disabled:opacity-60 mt-2"
          >
            {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our terms of service
        </p>
      </motion.div>
    </div>
  );
}
