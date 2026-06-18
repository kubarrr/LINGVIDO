import Link from "next/link";
import { Camera, Mic, Type, Brain, CalendarDays, Flame, Globe } from "lucide-react";

export const metadata = {
  title: "Lingvido — Learn languages from real life",
  description: "Snap a photo, record a voice note or type what you see — Lingvido turns it into a bite-size language lesson. 40 languages, daily quiz, streaks and a global ranking.",
};

const FLAGS = ["🇪🇸", "🇫🇷", "🇩🇪", "🇮🇹", "🇯🇵", "🇵🇱", "🇨🇳", "🇺🇦", "🇵🇹", "🇰🇷", "🇸🇪", "🇹🇷", "🇬🇷", "🇳🇱", "🇫🇮", "🇭🇷"];

const FEATURES = [
  { icon: Camera, title: "Snap anything", text: "Photograph an object, place or moment and get vocabulary, grammar and culture from it." },
  { icon: Mic, title: "Voice or text", text: "No camera? Just say or type what you see — the lesson adapts to any input." },
  { icon: Brain, title: "Daily quiz", text: "Six fast questions a day, game-show style, with daily, weekly and all-time rankings." },
  { icon: CalendarDays, title: "Country almanac", text: "A fresh calendar page each day: on-this-day events, people and places." },
  { icon: Flame, title: "Streaks & XP", text: "Build a daily streak, earn XP and climb the global leaderboard." },
  { icon: Globe, title: "40 languages", text: "From Spanish and Japanese to Finnish and Croatian — each with its own look." },
];

export default function WelcomePage() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Hero */}
      <header className="px-6 pt-16 pb-12 max-w-3xl mx-auto w-full text-center flex flex-col items-center gap-6">
        <img src="/icon.svg" alt="Lingvido" width={88} height={88} className="rounded-3xl shadow-lg" />
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          <span style={{ background: "linear-gradient(135deg, var(--lang-from), var(--lang-to))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Lingvido
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-foreground/90 max-w-xl">
          Learn languages from real life. Snap a photo, record a voice note or type
          what you see — and get a bite-size AI lesson in seconds.
        </p>

        <div className="flex items-center gap-2 text-2xl">
          {FLAGS.map((f) => <span key={f}>{f}</span>)}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
          <Link
            href="/auth"
            className="px-8 py-4 rounded-2xl font-semibold text-white gradient-primary glow-purple transition-transform active:scale-95"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/auth"
            className="px-8 py-4 rounded-2xl font-semibold border border-border hover:border-primary/50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Three ways to learn */}
      <section className="px-6 pb-12 max-w-3xl mx-auto w-full">
        <div className="glass rounded-3xl p-6 flex flex-col sm:flex-row gap-4 text-center">
          {[
            { icon: Camera, label: "Photo" },
            { icon: Mic, label: "Voice" },
            { icon: Type, label: "Text" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-2 py-2">
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white">
                <Icon size={22} />
              </div>
              <span className="font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-16 max-w-3xl mx-auto w-full">
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="glass rounded-2xl p-5 flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-16 max-w-3xl mx-auto w-full text-center flex flex-col items-center gap-5">
        <h2 className="text-2xl font-bold">Start learning from the world around you</h2>
        <Link
          href="/auth"
          className="px-8 py-4 rounded-2xl font-semibold text-white gradient-primary glow-purple transition-transform active:scale-95"
        >
          Create your free account
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-auto px-6 py-8 border-t border-border text-center text-sm text-muted-foreground flex flex-col gap-2">
        <div className="flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <a href="mailto:j.rymarski06@gmail.com" className="hover:text-foreground transition-colors">Contact</a>
        </div>
        <p>© {new Date().getFullYear()} Lingvido</p>
      </footer>
    </div>
  );
}
