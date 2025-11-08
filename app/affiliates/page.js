import AffiliateForm from '../components/AffiliateForm';
import FAQAccordion from '../components/FAQAccordion';

const benefits = [
  {
    title: 'Earn up to 20% commission',
    description: 'Rewarded on every funded evaluation you unlock with world-class transparency.',
    icon: '💸'
  },
  {
    title: 'Launch-ready campaign kits',
    description: 'Access tested landing sections, email copy, and creative overlays tailored to convert prediction market audiences.',
    icon: '🚀'
  },
  {
    title: '24/7 partner success',
    description: 'Dedicated partner strategists plus responsive support so you scale without friction.',
    icon: '🤝'
  }
];

const audiences = [
  {
    title: 'Educators & Coaches',
    description: 'Monetize curriculum and cohorts with structured challenges purpose-built for prediction markets.',
    accent: 'from-blue-500/40 to-cyan-500/40'
  },
  {
    title: 'Community Builders',
    description: 'Bring a polished prop trading experience to Discord servers, Substacks, and Telegram groups.',
    accent: 'from-purple-500/40 to-indigo-500/40'
  },
  {
    title: 'Creators & Analysts',
    description: 'Share research-backed market calls backed by funding and a referral program your audience trusts.',
    accent: 'from-emerald-500/40 to-teal-500/40'
  }
];

const reasons = [
  {
    title: 'Straightforward structure',
    description: 'Crystal clear tiers with automated payouts. No hidden rev-shares or approval limbo.'
  },
  {
    title: 'PolyProp credibility',
    description: 'Partner with the flagship prediction market prop firm powering elite forecasters globally.'
  },
  {
    title: 'Modern tooling',
    description: 'Live dashboards, deep-link tracking, and on-platform content blocks designed for growth.'
  }
];

const stats = [
  { label: 'Avg partner earnings (Q3)', value: '—', trend: 'Shared transparently once approved' },
  { label: 'Markets funded via affiliates', value: '68%', trend: 'Real-time attribution' },
  { label: 'Creator satisfaction', value: '4.9/5', trend: 'NPS across power partners' }
];

export default function AffiliatesLandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-40 left-[10%] h-[18rem] w-[18rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-[5%] h-[26rem] w-[26rem] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),rgba(15,23,42,0.95))]" />
      </div>

      <main className="relative z-[1] max-w-7xl mx-auto px-6 pt-28 md:pt-36 pb-24 space-y-24">
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 backdrop-blur">
              <span className="text-base">✨</span>
              <span>PolyProp Partner Studio</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
                Become a PolyProp affiliate
              </h1>
              <p className="max-w-2xl text-lg text-white/80">
                Curate outcomes. Fund elite talent. Earn premium commissions. We built the PolyProp Affiliate Program for creators who expect the same polish they deliver.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="#apply"
                className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_40px_rgba(56,189,248,0.25)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(56,189,248,0.35)]"
              >
                Apply today
                <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href="/traders"
                className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 backdrop-blur transition hover:bg-white/10"
              >
                Explore trading experience
                <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {stats.map(({ label, value, trend }) => (
                <div key={label} className="group rounded-2xl border border-white/5 bg-white/2 px-5 py-6 backdrop-blur transition hover:border-white/20">
                  <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 text-xs text-white/60">{trend}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -translate-x-8 rounded-[32px] bg-gradient-to-br from-white/8 to-white/2 blur-3xl" />
            <div className="relative rounded-[32px] border border-white/10 bg-slate-900/80 p-10 shadow-[0_30px_80px_rgba(15,23,42,0.55)] backdrop-blur-xl">
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>Live partner feed</span>
                <span className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Online</span>
              </div>
              <div className="mt-8 space-y-6">
                {[
                  { name: 'Forecast Factory', stat: '+$9.8K revenue this month', detail: 'Hosted weekly market deep dives.' },
                  { name: 'Insights Collective', stat: '38 funded traders', detail: 'Converted 12% of newsletter signups.' },
                  { name: 'Macro Mosaic', stat: 'Payouts in under 48 hours', detail: 'Automated payout triggers enabled.' }
                ].map(({ name, stat, detail }) => (
                  <div key={name} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white/90">{name}</p>
                      <span className="text-xs text-emerald-300">{stat}</span>
                    </div>
                    <p className="mt-3 text-sm text-white/60">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8" aria-labelledby="benefits-heading">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="benefits-heading" className="text-3xl font-semibold">What you&apos;ll get</h2>
              <p className="mt-3 max-w-2xl text-base text-white/70">
                A crafted partner experience that feels as premium as the traders you champion. We deliver tooling that mirrors Apple-level polish, so your brand stays impeccable.
              </p>
            </div>
            <div className="text-sm text-white/60">Tailored onboarding in under 24 hours.</div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map(({ title, description, icon }) => (
              <article key={title} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur transition hover:border-cyan-400/40">
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/[0.04] to-white/5 opacity-0 transition group-hover:opacity-100" />
                <div className="relative">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">{icon}</span>
                  <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="audience-heading">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-10 backdrop-blur">
            <div className="absolute -top-20 -right-10 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative space-y-6">
              <h2 id="audience-heading" className="text-3xl font-semibold">Who it&apos;s for</h2>
              <p className="text-base text-white/70">
                If you attract curious minds—forecasters, analysts, traders, or data storytellers—PolyProp amplifies your influence with the capital stack event traders crave.
              </p>
              <ul className="space-y-4 text-sm text-white/65">
                <li className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">•</span>
                  No minimum audience size—just thoughtful distribution.
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300">•</span>
                  Personalized partner success with playbooks for your channel.
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-400/20 text-indigo-300">•</span>
                  Automated tracking, transparent attribution, instant reporting.
                </li>
              </ul>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {audiences.map(({ title, description, accent }) => (
              <article key={title} className={`rounded-3xl border border-white/10 bg-gradient-to-br ${accent} p-6 backdrop-blur-lg transition hover:border-white/30`}>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm text-white/70 leading-6">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-10" aria-labelledby="why-heading">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="why-heading" className="text-3xl font-semibold">Why PolyProp</h2>
              <p className="mt-3 max-w-3xl text-base text-white/70">
                Built by traders. Polished for storytellers. PolyProp combines premium brand touchpoints with the most sophisticated prediction market-backed funding platform.
              </p>
            </div>
            <div className="text-sm text-white/60">Every partner gets a dedicated strategist.</div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {reasons.map(({ title, description }) => (
              <article key={title} className="relative rounded-3xl border border-white/10 bg-white/[0.035] p-8 backdrop-blur transition hover:border-cyan-300/40">
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm text-white/70 leading-6">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="apply" className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start" aria-labelledby="apply-heading">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-10 backdrop-blur">
            <div className="absolute -top-24 right-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative space-y-4">
              <h2 id="apply-heading" className="text-3xl font-semibold">Apply in minutes</h2>
              <p className="text-base text-white/70">
                Tell us about your audience and how you plan to activate them. We review every application with partner success, then guide you through a curated onboarding.
              </p>
              <ul className="space-y-3 text-sm text-white/65">
                <li className="flex items-center gap-3">
                  <span className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-white/10 text-white">1</span>
                  Submit your details and channels.
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-white/10 text-white">2</span>
                  Meet your partner strategist.
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-white/10 text-white">3</span>
                  Launch campaigns with white-glove support.
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.55)] backdrop-blur-xl">
            <AffiliateForm />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 backdrop-blur" aria-labelledby="faq-heading">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="faq-heading" className="text-3xl font-semibold">FAQ</h2>
              <p className="mt-2 text-sm text-white/70">Everything partners ask before they unlock their first payout.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/50">Always-on support</span>
          </div>
          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <FAQAccordion />
          </div>
        </section>
      </main>
    </div>
  );
}
