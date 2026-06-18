import Link from "next/link";

export const metadata = { title: "Privacy Policy — Lingvido" };

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh px-5 py-10 max-w-2xl mx-auto">
      <Link href="/" className="text-primary text-sm">← Back</Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: 18 June 2026</p>

      <div className="flex flex-col gap-6 text-[15px] leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold mb-2">Who we are</h2>
          <p>
            Lingvido (&quot;we&quot;, &quot;the app&quot;) is a language-learning application that turns photos,
            voice notes and text into short AI-generated lessons. This policy explains what data we
            collect and how we use it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Data we collect</h2>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li><strong>Account data:</strong> your email address and username, used to sign you in.</li>
            <li><strong>Learning content:</strong> photos you upload, text you type and transcripts of voice notes you record, which are turned into lessons.</li>
            <li><strong>Progress data:</strong> XP, streaks, quiz scores, lessons and your chosen languages and levels.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">How we use it</h2>
          <p>
            We use your data to create lessons, save your history, run leaderboards and improve the
            app. Photos and text you submit are sent to our AI provider (OpenRouter) solely to
            generate your lesson. We do not sell your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Storage &amp; processing</h2>
          <p>
            Your account, lessons and images are stored using Supabase. Lesson generation is
            performed by third-party AI models accessed through OpenRouter. Data is transmitted over
            encrypted connections.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Deleting your data</h2>
          <p>
            You can permanently delete your account and all associated data at any time from
            <strong> Profile → Settings → Delete account</strong>. This removes your profile,
            lessons, images and scores. Deletion is immediate and irreversible.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Children</h2>
          <p>Lingvido is not directed at children under 13. We do not knowingly collect their data.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Contact</h2>
          <p>
            Questions about this policy? Contact us at{" "}
            <a className="text-primary underline" href="mailto:j.rymarski06@gmail.com">j.rymarski06@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
