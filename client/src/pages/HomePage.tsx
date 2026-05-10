import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import { fetchPosts } from '../features/blog/api/posts.api.js';
import type { PostSummary } from '../features/blog/api/posts.api.js';
import { fetchExploreBikes } from '../features/bikes/api/explore.api.js';
import { PostCard } from '../features/blog/components/PostCard.js';
import './home-page.css';

interface LiveStats {
  posts: { value: string; label: string } | null;
  bikes: { value: string; label: string } | null;
}

export function HomePage(): React.JSX.Element {
  const [recent, setRecent] = useState<PostSummary[] | null>(null);
  const [stats, setStats] = useState<LiveStats>({ posts: null, bikes: null });

  useEffect(() => {
    let cancelled = false;

    async function loadRecent(): Promise<void> {
      try {
        const res = await fetchPosts({ limit: 12 });
        if (!cancelled) setRecent(res.data);
      } catch {
        if (!cancelled) setRecent([]);
      }
    }

    async function loadStats(): Promise<void> {
      const out: LiveStats = { posts: null, bikes: null };
      try {
        const postsRes = await fetchPosts({ limit: 50 });
        if (postsRes.data.length > 0) {
          const suffix = postsRes.pagination.has_more ? '+' : '';
          out.posts = {
            value: `${postsRes.data.length}${suffix}`,
            label: postsRes.data.length === 1 ? 'story published' : 'stories published',
          };
        }
      } catch { /* hide stat on error */ }
      try {
        const bikesRes = await fetchExploreBikes({ limit: 50 });
        if (bikesRes.data.length > 0) {
          const suffix = bikesRes.pagination.has_more ? '+' : '';
          out.bikes = {
            value: `${bikesRes.data.length}${suffix}`,
            label: bikesRes.data.length === 1 ? 'bike registered' : 'bikes registered',
          };
        }
      } catch { /* hide stat on error */ }
      if (!cancelled) setStats(out);
    }

    void loadRecent();
    void loadStats();
    return () => { cancelled = true; };
  }, []);

  const hasStats = stats.posts !== null || stats.bikes !== null;
  const hasRecent = recent !== null && recent.length > 0;
  const quoteCandidates = (recent ?? [])
    .filter(p => p.excerpt !== null && p.excerpt.length >= 40)
    .slice(0, 3);
  const hasQuotes = quoteCandidates.length >= 2;

  return (
    <main className="home" id="main">
      {/* SECTION 1: hero */}
      <section className="home-hero" aria-labelledby="home-hero-title">
        <p className="home-hero__eyebrow">A field guide for cyclists</p>
        <h1 id="home-hero-title" className="home-hero__title display-cover">
          Ride, write, <em>and remember</em> every mile.
        </h1>
        <p className="home-hero__lead">
          Bike Connect is the warm, opinionated home for your ride stories,
          your bikes down to the chain, and the maintenance that keeps both rolling.
        </p>
        <div className="home-hero__actions">
          <Link to="/login" className="btn btn-primary btn-lg home-hero__cta-primary">
            Start your field journal
          </Link>
          <Link to="/posts" className="btn btn-ghost home-hero__cta-secondary">
            Read the blog
          </Link>
        </div>
        <p className="home-hero__trust" role="note">
          Free forever for personal use &middot; No credit card &middot; Built by riders
        </p>
        <div className="home-hero__photo-slot" role="presentation" aria-hidden="true" />
      </section>

      {/* SECTION 2: live stats strip */}
      {hasStats && (
        <section className="home-stats" aria-labelledby="home-stats-title">
          <p id="home-stats-title" className="home-stats__eyebrow">Built by the community</p>
          <ul className="home-stats__row">
            {stats.posts && (
              <li className="home-stats__item">
                <span className="home-stats__value">{stats.posts.value}</span>
                <span className="home-stats__label">{stats.posts.label}</span>
              </li>
            )}
            {stats.bikes && (
              <li className="home-stats__item">
                <span className="home-stats__value">{stats.bikes.value}</span>
                <span className="home-stats__label">{stats.bikes.label}</span>
              </li>
            )}
          </ul>
        </section>
      )}

      {/* SECTION 3: problem framing */}
      <section className="home-problem" aria-labelledby="home-problem-title">
        <header className="home-problem__header">
          <p className="home-problem__eyebrow">The problem</p>
          <h2 id="home-problem-title" className="home-problem__title">
            Riders generate a lot of small, important records.
            <em> Most of it gets lost.</em>
          </h2>
        </header>
        <ul className="home-problem__grid">
          <li className="home-problem__card">
            <ScatteredNotesIcon className="home-problem__icon" />
            <h3 className="home-problem__card-title">Scattered ride notes</h3>
            <p className="home-problem__card-copy">
              Photos in your camera roll, a route in Strava, half a paragraph in
              Notes &mdash; the story of the ride is in five different apps.
            </p>
          </li>
          <li className="home-problem__card">
            <ForgottenServiceIcon className="home-problem__icon" />
            <h3 className="home-problem__card-title">Forgotten maintenance</h3>
            <p className="home-problem__card-copy">
              When did you last replace the chain? The cassette? The brake pads?
              If the answer is &ldquo;a while back&rdquo;, you already have a problem.
            </p>
          </li>
          <li className="home-problem__card">
            <LostReceiptsIcon className="home-problem__icon" />
            <h3 className="home-problem__card-title">Lost gear receipts</h3>
            <p className="home-problem__card-copy">
              Warranty claims, insurance, resale &mdash; all easier when you can
              prove what you bought, when, and what bike it&rsquo;s on.
            </p>
          </li>
        </ul>
      </section>

      {/* SECTION 4: how it works */}
      <section className="home-how" aria-labelledby="home-how-title">
        <header className="home-how__header">
          <p className="home-how__eyebrow">How it works</p>
          <h2 id="home-how-title" className="home-how__title">
            Three habits, one warm place.
          </h2>
          <p className="home-how__lead">
            Bike Connect is built around the actual rhythm of riding. You write
            what happened, you register what you ride, and you log what you fix.
            Everything else &mdash; reminders, history, public profiles &mdash;
            falls out of those three habits.
          </p>
        </header>
        <ol className="home-how__steps">
          <li className="home-how__step">
            <span className="home-how__step-number">01</span>
            <PenIcon className="home-how__step-icon" />
            <h3 className="home-how__step-title">Write</h3>
            <p className="home-how__step-copy">
              Long-form ride stories, route notes, gear reviews. A real editor,
              not a tweet box. Drafts stay drafts until you&rsquo;re ready.
            </p>
          </li>
          <li className="home-how__step">
            <span className="home-how__step-number">02</span>
            <BikeIcon className="home-how__step-icon" />
            <h3 className="home-how__step-title">Register</h3>
            <p className="home-how__step-copy">
              Add every bike &mdash; brand, year, components down to the chain,
              photos, mileage. Public if you want, private by default.
            </p>
          </li>
          <li className="home-how__step">
            <span className="home-how__step-number">03</span>
            <WrenchIcon className="home-how__step-icon" />
            <h3 className="home-how__step-title">Maintain</h3>
            <p className="home-how__step-copy">
              Log services, set reminders, never miss a chain swap. Each entry
              attaches to a bike so the timeline tells the truth, not your memory.
            </p>
          </li>
        </ol>
      </section>

      {/* SECTION 5: feature deep-dive */}
      <section className="home-features" aria-labelledby="home-features-title">
        <header className="home-features__header">
          <p className="home-features__eyebrow">What you get</p>
          <h2 id="home-features-title" className="home-features__title">
            A real tool for each of the three habits.
          </h2>
        </header>

        <article className="home-feature home-feature--left">
          <div className="home-feature__visual">
            <EditorialIllustration className="home-feature__svg" />
          </div>
          <div className="home-feature__copy">
            <p className="home-feature__eyebrow">Editorial blog</p>
            <h3 className="home-feature__title">Long-form, not 280 characters.</h3>
            <p className="home-feature__lead">
              A magazine-grade editor with drop caps, pull quotes, and a
              reading-time chip. Built for actual ride reports, not status
              updates.
            </p>
            <ul className="home-feature__list">
              <li>Drafts, scheduled posts, and tags</li>
              <li>Markdown-style toolbar &mdash; no lock-in</li>
              <li>Public author profile with bio + bike list</li>
            </ul>
            <Link to="/posts" className="home-feature__cta">
              Browse the blog &rarr;
            </Link>
          </div>
        </article>

        <article className="home-feature home-feature--right">
          <div className="home-feature__copy">
            <p className="home-feature__eyebrow">Bike registry</p>
            <h3 className="home-feature__title">Every component, every photo, every mile.</h3>
            <p className="home-feature__lead">
              Register your bikes the way a workshop catalog would: numbered
              spec sheets, a photo gallery, mileage that actually adds up over
              the years.
            </p>
            <ul className="home-feature__list">
              <li>Frame, drivetrain, wheels, brakes, contact &mdash; all itemised</li>
              <li>Multiple photos per bike with a built-in gallery</li>
              <li>Lifetime mileage from logged rides</li>
            </ul>
            <Link to="/explore/bikes" className="home-feature__cta">
              Explore the registry &rarr;
            </Link>
          </div>
          <div className="home-feature__visual">
            <RegistryIllustration className="home-feature__svg" />
          </div>
        </article>

        <article className="home-feature home-feature--left">
          <div className="home-feature__visual">
            <MaintenanceIllustration className="home-feature__svg" />
          </div>
          <div className="home-feature__copy">
            <p className="home-feature__eyebrow">Maintenance log</p>
            <h3 className="home-feature__title">Never miss a chain swap again.</h3>
            <p className="home-feature__lead">
              Log services per bike, set service-interval reminders, see the full
              timeline. Overdue, due-soon, and scheduled states are colour
              <em> and</em> icon coded &mdash; not colour alone.
            </p>
            <ul className="home-feature__list">
              <li>Per-bike service timeline</li>
              <li>Reminders by mileage or by date</li>
              <li>Receipts and notes attached to each entry</li>
            </ul>
            <Link to="/login" className="home-feature__cta home-feature__cta--strong">
              Start your maintenance log &rarr;
            </Link>
          </div>
        </article>

        {/* Mid-page primary CTA repetition. */}
        <div className="home-features__cta">
          <Link to="/login" className="btn btn-primary btn-lg">
            Start your field journal
          </Link>
          <p className="home-features__cta-sub">
            Free forever for personal use &middot; Sign in with Google &middot; 30 seconds
          </p>
        </div>
      </section>

      {/* SECTION 6: live recent posts */}
      {hasRecent && (
        <section className="home-recent" aria-labelledby="home-recent-title">
          <header className="home-recent__header">
            <h2 id="home-recent-title" className="section-heading">What riders are publishing</h2>
            <p className="home-recent__lead">
              Real stories from the community, pulled live from the blog.
            </p>
          </header>
          <ul className="home-recent__grid">
            {recent.slice(0, 3).map(post => (
              <li key={post.id} className="home-recent__item">
                <PostCard post={post} variant="compact" />
              </li>
            ))}
          </ul>
          <p className="home-recent__more">
            <Link to="/posts" className="btn btn-ghost">Browse all stories &rarr;</Link>
          </p>
        </section>
      )}

      {/* SECTION 7: quotes / testimonials */}
      {hasQuotes && (
        <section className="home-quotes" aria-labelledby="home-quotes-title">
          <header className="home-quotes__header">
            <p className="home-quotes__eyebrow">Voices from the community</p>
            <h2 id="home-quotes-title" className="home-quotes__title">
              Real posts, real riders. Pulled live from the blog.
            </h2>
          </header>
          <ul className="home-quotes__grid">
            {quoteCandidates.map(post => (
              <li key={post.id} className="home-quote">
                <p className="home-quote__excerpt">
                  &ldquo;{post.excerpt}&rdquo;
                </p>
                <footer className="home-quote__attrib">
                  <span className="home-quote__author">{post.author_display_name}</span>
                  <Link to={`/posts/${post.slug}`} className="home-quote__title-link">
                    {post.title}
                  </Link>
                </footer>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* SECTION 8: principles */}
      <section className="home-principles" aria-labelledby="home-principles-title">
        <header className="home-principles__header">
          <p className="home-principles__eyebrow">Principles</p>
          <h2 id="home-principles-title" className="home-principles__title">
            A few promises we plan to keep.
          </h2>
        </header>
        <ul className="home-principles__row">
          <li className="home-principle">
            <RidersIcon className="home-principle__icon" />
            <p className="home-principle__copy">Built by riders, not VCs.</p>
          </li>
          <li className="home-principle">
            <FreeIcon className="home-principle__icon" />
            <p className="home-principle__copy">Free forever for personal use.</p>
          </li>
          <li className="home-principle">
            <ExportIcon className="home-principle__icon" />
            <p className="home-principle__copy">Your data, your bikes, your stories &mdash; exportable.</p>
          </li>
          <li className="home-principle">
            <OpenStandardsIcon className="home-principle__icon" />
            <p className="home-principle__copy">Built on open standards, no lock-in.</p>
          </li>
        </ul>
      </section>

      {/* SECTION 9: FAQ — native <details>, no JS */}
      <section className="home-faq" aria-labelledby="home-faq-title">
        <header className="home-faq__header">
          <p className="home-faq__eyebrow">Common questions</p>
          <h2 id="home-faq-title" className="home-faq__title">
            Before you sign up.
          </h2>
        </header>
        <div className="home-faq__list">
          <details className="home-faq__item">
            <summary className="home-faq__question">Is it really free?</summary>
            <div className="home-faq__answer">
              <p>
                Yes. Bike Connect is free for personal use today, and the plan is to keep it
                that way. There is no paid tier hidden behind a feature flag, no &ldquo;pro&rdquo;
                unlocks, no upsell on save. If that ever changes, the free tier will keep
                everything you already have.
              </p>
            </div>
          </details>
          <details className="home-faq__item">
            <summary className="home-faq__question">Do I need a Google account?</summary>
            <div className="home-faq__answer">
              <p>
                For now, yes &mdash; sign-in is &ldquo;Sign in with Google&rdquo; only. We use
                Google as the identity provider so we don&rsquo;t have to store passwords.
                Email + password (and other providers) may arrive later; if you don&rsquo;t
                want a Google account, wait for that.
              </p>
            </div>
          </details>
          <details className="home-faq__item">
            <summary className="home-faq__question">Can I export my data?</summary>
            <div className="home-faq__answer">
              <p>
                Yes. Posts, bikes, components, maintenance logs, and rides are all owned by
                you and can be exported. The export format is JSON today and will gain
                common interchange formats over time.
              </p>
            </div>
          </details>
          <details className="home-faq__item">
            <summary className="home-faq__question">Is my data private?</summary>
            <div className="home-faq__answer">
              <p>
                Posts are public when you publish them and private as drafts. Bikes are
                private by default; you choose when to make one public via the bike
                registry. Maintenance logs and rides are always private to you. We do
                not sell, share, or analyse your content for ads.
              </p>
            </div>
          </details>
          <details className="home-faq__item">
            <summary className="home-faq__question">Does it work on my phone?</summary>
            <div className="home-faq__answer">
              <p>
                Yes &mdash; the site is responsive from 360&nbsp;px upward and is intended
                to work without horizontal scroll on every common phone size. There is
                no native app today; the web version is the product.
              </p>
            </div>
          </details>
          <details className="home-faq__item">
            <summary className="home-faq__question">Why not just use Strava?</summary>
            <div className="home-faq__answer">
              <p>
                Use both! Strava is built around the activity feed &mdash; speed, segments,
                kudos. Bike Connect is built around the long-form story, the bike, and the
                maintenance log. Different tools, different jobs. Many riders keep a Strava
                account for the data and a Bike Connect account for the writing.
              </p>
            </div>
          </details>
          <details className="home-faq__item">
            <summary className="home-faq__question">Who built this?</summary>
            <div className="home-faq__answer">
              <p>
                One person, as a university project &mdash; built openly with React, Node,
                and Postgres. The code is auditable, the brand is honest, and the roadmap
                is shaped by real rider feedback rather than growth metrics.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* SECTION 10: final CTA */}
      <section className="home-final-cta" aria-labelledby="home-final-cta-title">
        <TopoBackgroundPattern className="home-final-cta__topo" />
        <div className="home-final-cta__inner">
          <h2 id="home-final-cta-title" className="home-final-cta__title">
            Start your field journal.
          </h2>
          <p className="home-final-cta__lead">
            Free forever for personal use. Sign in with Google in about thirty seconds.
            No credit card. No spam.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg btn-on-dark home-final-cta__action">
            Sign in with Google
          </Link>
          <p className="home-final-cta__sub">
            Or <Link to="/posts" className="home-final-cta__sub-link">read the blog first</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
 * Inline SVG components — hand-rolled
 * No icon library — currentColor so they follow parent text colour
 * ============================================================ */

interface IconProps { className?: string }

// Problem-framing icons

function ScatteredNotesIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="9" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="14" y1="14" x2="22" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="22" x2="20" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ForgottenServiceIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 10 V16 L20 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 7 L25 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LostReceiptsIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M9 5 H23 V27 L20 25 L17 27 L14 25 L11 27 L9 25 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="13" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="19" x2="17" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// How-it-works step icons

function PenIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M28 10L30 12L16 26L12 28L14 24L28 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M24 14L26 16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BikeIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="12" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="28" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 28L20 14L28 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 14H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function WrenchIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M26 12C29 15 29 19 26 22L18 30C16 32 13 32 11 30C9 28 9 25 11 23L19 15C22 12 26 12 26 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="14" cy="27" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Feature deep-dive illustrations

function EditorialIllustration({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="360" height="240" viewBox="0 0 360 240" fill="none" aria-hidden="true">
      <rect x="20" y="20" width="320" height="200" rx="6" stroke="currentColor" strokeWidth="1.5" fill="var(--color-surface-2)" />
      <rect x="40" y="40" width="160" height="6" fill="currentColor" opacity="0.85" />
      <line x1="40" y1="64" x2="320" y2="64" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <g opacity="0.55">
        <line x1="40"  y1="84"  x2="180" y2="84"  stroke="currentColor" strokeWidth="1" />
        <line x1="40"  y1="98"  x2="180" y2="98"  stroke="currentColor" strokeWidth="1" />
        <line x1="40"  y1="112" x2="170" y2="112" stroke="currentColor" strokeWidth="1" />
        <line x1="40"  y1="132" x2="180" y2="132" stroke="currentColor" strokeWidth="1" />
        <line x1="40"  y1="146" x2="160" y2="146" stroke="currentColor" strokeWidth="1" />
        <line x1="200" y1="84"  x2="320" y2="84"  stroke="currentColor" strokeWidth="1" />
        <line x1="200" y1="98"  x2="320" y2="98"  stroke="currentColor" strokeWidth="1" />
        <line x1="200" y1="112" x2="320" y2="112" stroke="currentColor" strokeWidth="1" />
        <line x1="200" y1="132" x2="310" y2="132" stroke="currentColor" strokeWidth="1" />
        <line x1="200" y1="146" x2="320" y2="146" stroke="currentColor" strokeWidth="1" />
      </g>
      <rect x="40" y="170" width="4" height="34" fill="var(--color-accent)" />
      <line x1="56" y1="178" x2="240" y2="178" stroke="currentColor" strokeWidth="1.25" opacity="0.85" />
      <line x1="56" y1="192" x2="200" y2="192" stroke="currentColor" strokeWidth="1.25" opacity="0.85" />
    </svg>
  );
}

function RegistryIllustration({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="360" height="240" viewBox="0 0 360 240" fill="none" aria-hidden="true">
      <rect x="20" y="20" width="320" height="200" rx="6" stroke="currentColor" strokeWidth="1.5" fill="var(--color-surface-2)" />
      <circle cx="110" cy="160" r="34" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="240" cy="160" r="34" stroke="currentColor" strokeWidth="1.5" />
      <path d="M110 160 L170 90 L240 160" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M170 90 L210 90 L210 130" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M148 92 L185 92" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <g fontFamily="var(--font-body)" fontSize="10" fill="var(--color-accent)">
        <circle cx="170" cy="90"  r="9" stroke="var(--color-accent)" strokeWidth="1.25" fill="var(--color-bg)" />
        <text x="170" y="93.5" textAnchor="middle">1</text>
        <circle cx="210" cy="130" r="9" stroke="var(--color-accent)" strokeWidth="1.25" fill="var(--color-bg)" />
        <text x="210" y="133.5" textAnchor="middle">2</text>
        <circle cx="240" cy="160" r="9" stroke="var(--color-accent)" strokeWidth="1.25" fill="var(--color-bg)" />
        <text x="240" y="163.5" textAnchor="middle">3</text>
      </g>
    </svg>
  );
}

function MaintenanceIllustration({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="360" height="240" viewBox="0 0 360 240" fill="none" aria-hidden="true">
      <rect x="20" y="20" width="320" height="200" rx="6" stroke="currentColor" strokeWidth="1.5" fill="var(--color-surface-2)" />
      <line x1="80" y1="50" x2="80" y2="200" stroke="currentColor" strokeWidth="1.25" strokeDasharray="3 4" opacity="0.6" />
      <g fill="var(--color-primary)">
        <circle cx="80" cy="70"  r="6" />
        <circle cx="80" cy="130" r="6" />
        <circle cx="80" cy="190" r="6" />
      </g>
      <g opacity="0.85" stroke="currentColor" strokeWidth="1.25">
        <line x1="100" y1="68"  x2="260" y2="68"  />
        <line x1="100" y1="78"  x2="220" y2="78"  />
        <line x1="100" y1="128" x2="280" y2="128" />
        <line x1="100" y1="138" x2="200" y2="138" />
        <line x1="100" y1="188" x2="240" y2="188" />
        <line x1="100" y1="198" x2="180" y2="198" />
      </g>
      <rect x="260" y="180" width="60" height="20" rx="10" fill="var(--color-accent)" opacity="0.8" />
      <text x="290" y="194" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--color-bg)">Due soon</text>
    </svg>
  );
}

// Principle icons

function RidersIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="11" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 24 C6 19, 16 19, 16 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="22" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 24 C17 19, 27 19, 27 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FreeIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 25 C8 19, 6 14, 9 11 C12 8, 16 11, 16 13 C16 11, 20 8, 23 11 C26 14, 24 19, 16 25 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ExportIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7 14 V25 H21 V14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 19 V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 10 L14 6 L18 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OpenStandardsIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M5 9 C9 8, 14 9, 16 11 C18 9, 23 8, 27 9 V24 C23 23, 18 24, 16 26 C14 24, 9 23, 5 24 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 11 V26" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// Final CTA topographic background

function TopoBackgroundPattern({ className }: IconProps): React.JSX.Element {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 1200 400"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="currentColor" strokeWidth="1" fill="none" opacity="0.08">
        <path d="M0 80 C 200 40, 400 120, 600 80 S 1000 40, 1200 100" />
        <path d="M0 160 C 250 120, 450 200, 700 150 S 1050 110, 1200 180" />
        <path d="M0 240 C 200 200, 400 280, 600 240 S 1000 200, 1200 260" />
        <path d="M0 320 C 250 280, 450 360, 700 310 S 1050 270, 1200 340" />
      </g>
    </svg>
  );
}
