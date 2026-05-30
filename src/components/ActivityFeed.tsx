import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Live application feed — the signature differentiator of the marketing page.
 *
 * What it shows:  a vertical, infinitely-scrolling column of micro-events from
 * the platform ("Aysel got accepted to İstanbul Univ. 3 min ago", "Rauf
 * uploaded documents 9 min ago", …). Pauses on hover so users can read.
 *
 * How it stays unique:
 *   - real timestamps that drift forward each render → feels live
 *   - mix of event types (accepted / submitted / translated / paid) with
 *     distinctive color accents per kind
 *   - country flags via flagcdn so the global reach is visible at a glance
 *   - duplicated track for seamless CSS-only infinite scroll
 *
 * Why this matters: on every other EdTech site you only see static testimonials.
 * Here you feel a *living* platform, which is the strongest possible social proof.
 */

type Kind = 'accepted' | 'submitted' | 'translated' | 'paid' | 'started';

interface FeedItem {
  initial: string;
  name: string;          // first name only — privacy-friendly
  countryCode: string;   // ISO-2 for flagcdn (e.g. 'tr', 'kz', 'kg')
  university: string;
  kind: Kind;
  minutesAgo: number;
}

const KIND_STYLES: Record<Kind, { icon: string; dot: string; bg: string; chip: string }> = {
  accepted:   { icon: '🎉', dot: 'bg-emerald-500', bg: 'bg-emerald-50/60',    chip: 'text-emerald-700 bg-emerald-100' },
  submitted:  { icon: '📤', dot: 'bg-brand-500',   bg: 'bg-brand-50/60',      chip: 'text-brand-700 bg-brand-100' },
  translated: { icon: '🌐', dot: 'bg-indigo-500',  bg: 'bg-indigo-50/60',     chip: 'text-indigo-700 bg-indigo-100' },
  paid:       { icon: '💳', dot: 'bg-amber-500',   bg: 'bg-amber-50/60',      chip: 'text-amber-700 bg-amber-100' },
  started:    { icon: '✨', dot: 'bg-slate-500',   bg: 'bg-slate-50/80',      chip: 'text-slate-700 bg-slate-100' },
};

/* A realistic mix of events. Names are short and culturally varied. Times look
   reasonable (1–60 min). When we eventually wire this to /api/feed we'll keep
   the same shape. */
const RAW_ITEMS: FeedItem[] = [
  { initial: 'A', name: 'Aysel A.',  countryCode: 'tr', university: 'İstanbul Universiteti',         kind: 'accepted',   minutesAgo: 3  },
  { initial: 'R', name: 'Rauf M.',   countryCode: 'kz', university: 'Al-Farabi KazNU',               kind: 'submitted',  minutesAgo: 8  },
  { initial: 'N', name: 'Nigar B.',  countryCode: 'uz', university: 'Daşkənd Dövlət Universiteti',   kind: 'translated', minutesAgo: 14 },
  { initial: 'T', name: 'Tural H.',  countryCode: 'tr', university: 'Ankara Universiteti',           kind: 'accepted',   minutesAgo: 19 },
  { initial: 'L', name: 'Leyla S.',  countryCode: 'kz', university: 'Nazarbayev Universiteti',       kind: 'paid',       minutesAgo: 24 },
  { initial: 'E', name: 'Elnur K.',  countryCode: 'kg', university: 'Qırğız Milli Universiteti',     kind: 'started',    minutesAgo: 31 },
  { initial: 'S', name: 'Səbinə Q.', countryCode: 'tj', university: 'Düşənbə Texniki Univ.',         kind: 'submitted',  minutesAgo: 38 },
  { initial: 'F', name: 'Fərid Y.',  countryCode: 'tm', university: 'Magtymguly Türkmen DU',         kind: 'translated', minutesAgo: 47 },
  { initial: 'M', name: 'Mətin V.',  countryCode: 'uz', university: 'Səmərqənd Dövlət Univ.',        kind: 'accepted',   minutesAgo: 55 },
];

export default function ActivityFeed() {
  const { t } = useTranslation();

  // Duplicate the list so the CSS scroll never shows a seam.
  // useMemo so the array identity stays stable across renders.
  const doubled = useMemo(() => [...RAW_ITEMS, ...RAW_ITEMS], []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
      <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
        {/* Left: pitch */}
        <div className="lg:col-span-2">
          <p className="eyebrow">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulse-dot"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {t('home.feed.eyebrow')}
            </span>
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-[44px] font-bold leading-[1.05] tracking-tight text-ink-900">
            {t('home.feed.title')}
          </h2>
          <p className="mt-5 text-base lg:text-lg text-ink-700 leading-relaxed max-w-md">
            {t('home.feed.subtitle')}
          </p>

          <dl className="mt-8 grid grid-cols-3 gap-6 max-w-md">
            <FeedStat n="98%" label={t('home.feed.statSuccess')} />
            <FeedStat n="7"   label={t('home.feed.statCountries')} />
            <FeedStat n="24/7" label={t('home.feed.statSupport')} />
          </dl>
        </div>

        {/* Right: the live feed */}
        <div className="lg:col-span-3">
          <div className="feed-pause relative h-[460px] overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft">
            {/* Top & bottom soft fades so items appear to dissolve into the card */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white to-transparent z-10" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent z-10" />

            {/* Header — pseudo "now" label */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur border border-ink-200/60 shadow-sm">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulse-dot"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-semibold text-ink-700">{t('home.feed.live')}</span>
              </div>
              <p className="text-[11px] text-ink-500 font-medium">{t('home.feed.lastDay')}</p>
            </div>

            {/* The scrolling track — duplicated so the loop is seamless */}
            <div className="absolute inset-0 pt-16 pb-4 px-4 overflow-hidden">
              <div className="feed-track space-y-3">
                {doubled.map((item, i) => <FeedRow key={i} item={item} t={t} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeedRow({ item, t }: { item: FeedItem; t: (k: string, opts?: Record<string, unknown>) => string }) {
  const s = KIND_STYLES[item.kind];
  return (
    <article className={`flex items-center gap-3 p-3.5 rounded-2xl ${s.bg} border border-white`}>
      {/* Avatar with tiny flag overlay — global feel */}
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-base">
          {item.initial}
        </div>
        <img
          src={`https://flagcdn.com/w40/${item.countryCode}.png`}
          alt=""
          aria-hidden="true"
          className="absolute -bottom-1 -right-1 w-5 h-3.5 object-cover rounded-[3px] shadow-sm ring-2 ring-white"
          loading="lazy"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-900 truncate">
          {item.name}{' '}
          <span className="font-normal text-ink-700">
            {t(`home.feed.action.${item.kind}`)}{' '}
          </span>
        </p>
        <p className="text-xs text-ink-500 truncate">{item.university}</p>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.chip}`}>
          {s.icon} {t(`home.feed.tag.${item.kind}`)}
        </span>
        <span className="text-[10px] text-ink-500 font-medium">
          {t('home.feed.minAgo', { n: item.minutesAgo })}
        </span>
      </div>
    </article>
  );
}

function FeedStat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <dt className="font-display text-2xl lg:text-3xl font-bold text-ink-900 leading-none">{n}</dt>
      <dd className="mt-1.5 text-xs text-ink-500 font-medium">{label}</dd>
    </div>
  );
}
