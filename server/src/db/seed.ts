import { sql } from 'kysely';
import { db } from './index.js';
import type {
  BikeType,
  ComponentCategory,
  MaintenanceType,
} from '@bike-connect/shared';

/**
 * Idempotent seed script: inserts canonical demo data so the site has
 * blog posts, tags, and users visible without a real Google sign-in.
 *
 * Uses deterministic UUIDs + ON CONFLICT DO NOTHING so it can be re-run
 * safely. Safe to run against a non-empty DB — never mutates real users.
 */

// Deterministic UUIDs — never collide with real Google-auth users
const USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    google_id: 'seed-elena-rossi',
    email: 'elena@seed.bikeconnect.local',
    display_name: 'Elena Rossi',
    avatar_url: '/avatars/elena-rossi.svg',
    bio: 'Gravel-curious roadie from Bologna. Notes on wheels, chains, and the occasional espresso-fuelled mountain day.',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    google_id: 'seed-marko-jensen',
    email: 'marko@seed.bikeconnect.local',
    display_name: 'Marko Jensen',
    avatar_url: '/avatars/marko-jensen.svg',
    bio: 'Former mechanic, part-time writer. I maintain too many bikes and I have opinions about chain lube.',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    google_id: 'seed-priya-sharma',
    email: 'priya@seed.bikeconnect.local',
    display_name: 'Priya Sharma',
    avatar_url: '/avatars/priya-sharma.svg',
    bio: 'Ultra-endurance rider and coach. Writing about long days in the saddle and the training that makes them survivable.',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    google_id: 'seed-tom-becker',
    email: 'tom@seed.bikeconnect.local',
    display_name: 'Tom Becker',
    avatar_url: '/avatars/tom-becker.svg',
    bio: 'Commuter by day, weekend climber. Big fan of unfashionable bikes.',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    google_id: 'seed-anna-novak',
    email: 'anna@seed.bikeconnect.local',
    display_name: 'Anna Novák',
    avatar_url: '/avatars/anna-novak.svg',
    bio: 'Mountain biker and trail builder from the Czech Republic. If it has knobby tires and a dropper, I will ride it.',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    google_id: 'seed-david-okafor',
    email: 'david@seed.bikeconnect.local',
    display_name: 'David Okafor',
    avatar_url: '/avatars/david-okafor.svg',
    bio: 'London bike commuter logging every mile. Convinced a good set of fenders is the best upgrade nobody buys.',
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    google_id: 'seed-sofia-lindqvist',
    email: 'sofia@seed.bikeconnect.local',
    display_name: 'Sofia Lindqvist',
    avatar_url: '/avatars/sofia-lindqvist.svg',
    bio: 'Randonneur from Gothenburg. 200s, 300s, and the occasional 600 when the weather cooperates, which it never does.',
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    google_id: 'seed-yuki-tanaka',
    email: 'yuki@seed.bikeconnect.local',
    display_name: 'Yuki Tanaka',
    avatar_url: '/avatars/yuki-tanaka.svg',
    bio: 'Track and fixed-gear rider in Osaka. Minimal bikes, maximal opinions about chainline.',
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    google_id: 'seed-liam-byrne',
    email: 'liam@seed.bikeconnect.local',
    display_name: 'Liam Byrne',
    avatar_url: '/avatars/liam-byrne.svg',
    bio: 'Enduro and trail rider from the Wicklow hills. Two full-suspension bikes and a hardtail for honesty.',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    google_id: 'seed-carla-mendes',
    email: 'carla@seed.bikeconnect.local',
    display_name: 'Carla Mendes',
    avatar_url: '/avatars/carla-mendes.svg',
    bio: 'Bikepacking and long-distance touring out of Lisbon. The bike is the luggage rack now.',
  },
] as const;

const TAGS = [
  { name: 'gravel', slug: 'gravel' },
  { name: 'maintenance', slug: 'maintenance' },
  { name: 'review', slug: 'review' },
  { name: 'ride-report', slug: 'ride-report' },
  { name: 'mtb', slug: 'mtb' },
  { name: 'road', slug: 'road' },
  { name: 'climbing', slug: 'climbing' },
  { name: 'tires', slug: 'tires' },
  { name: 'drivetrain', slug: 'drivetrain' },
  { name: 'long-distance', slug: 'long-distance' },
  { name: 'commuting', slug: 'commuting' },
  { name: 'touring', slug: 'touring' },
  { name: 'bikepacking', slug: 'bikepacking' },
  { name: 'training', slug: 'training' },
  { name: 'gear', slug: 'gear' },
  { name: 'wheels', slug: 'wheels' },
  { name: 'racing', slug: 'racing' },
  { name: 'winter', slug: 'winter' },
];

type PostCategory = 'review' | 'maintenance_guide' | 'ride_report' | 'general';

interface SeedPost {
  slug: string;
  author_id: string;
  title: string;
  excerpt: string;
  cover_image_url: string;
  category: PostCategory;
  published_days_ago: number;
  content: Record<string, unknown>;
  tag_slugs: string[];
}

// Helper to build TipTap ProseMirror JSON compactly.
const p = (text: string): Record<string, unknown> => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});

const pRich = (...parts: Array<{ text: string; bold?: boolean; italic?: boolean }>): Record<string, unknown> => ({
  type: 'paragraph',
  content: parts.map(({ text, bold, italic }) => {
    const marks: Array<{ type: string }> = [];
    if (bold) marks.push({ type: 'bold' });
    if (italic) marks.push({ type: 'italic' });
    return marks.length > 0
      ? { type: 'text', marks, text }
      : { type: 'text', text };
  }),
});

const h = (level: 2 | 3, text: string): Record<string, unknown> => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
});

const ul = (...items: string[]): Record<string, unknown> => ({
  type: 'bulletList',
  content: items.map((text) => ({
    type: 'listItem',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  })),
});

const ol = (...items: string[]): Record<string, unknown> => ({
  type: 'orderedList',
  content: items.map((text) => ({
    type: 'listItem',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  })),
});

const quote = (text: string): Record<string, unknown> => ({
  type: 'blockquote',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const POSTS: SeedPost[] = [
  {
    slug: 'first-500km-gravel-tires-review',
    author_id: USERS[0].id,
    title: 'First 500 km on gravel tires: a real-world review',
    excerpt: 'Six weeks, two bike-packing weekends, and one very wet commute. What I learned running 42 mm gravel tires on everything from pavement to broken farm roads.',
    cover_image_url: '/blog-covers/first-500km-gravel-tires-review.avif',
    category: 'review',
    published_days_ago: 3,
    tag_slugs: ['gravel', 'review', 'tires'],
    content: {
      type: 'doc',
      content: [
        p("I've been curious about gravel tires for a while. My road setup is fast but anxious on anything that isn't pristine tarmac, and my commute includes a 3 km stretch of poorly-paved canal path that eats 25 mm road tires for breakfast."),
        p("So I bought a set of 42 mm gravel tires, fitted them to my winter bike, and rode 500 km on them over six weeks. Here is what actually held up."),
        h(2, 'The setup'),
        p('Tires: 700x42 mm, tubeless, 50 TPI casing. Rim: 25 mm internal width, hooked. Pressure: 2.3 bar front, 2.5 bar rear for my 74 kg. I ran them over a mix of smooth tarmac, cracked urban commuting surfaces, wet forest tracks, and two days of loose gravel in the Apennines.'),
        h(2, 'What surprised me'),
        pRich(
          { text: 'Rolling resistance on pavement is ', bold: false },
          { text: 'much', bold: true, italic: true },
          { text: ' better than I expected.', bold: false },
        ),
        p('I was braced for a 5 km/h penalty on my daily commute. In practice it was maybe 1 km/h at the same effort, and on the canal path I was faster because I stopped picking my way around every crack. Supple casings do a lot of work here.'),
        quote("If you ride anything other than perfect tarmac, the supple 42 mm tire is probably faster door-to-door than a 25 mm race tire at 7 bar. I did not expect to say that."),
        h(2, 'Where they shone'),
        ul(
          'Wet cobbles: unflappable. The contact patch is just too big to care.',
          'Broken farm roads: the ride quality is like your saddle grew a second spring.',
          'Loose fire roads: cornering grip is way higher than anything with slick centre tread.',
        ),
        h(2, 'Where they did not'),
        p('Sustained efforts above 35 km/h on smooth pavement, sprinting from a traffic light still feels like the tire is flexing more than it should. If your weekly ride is a Saturday paceline group, these probably feel slow.'),
        p("Also: mud. The knobs are small and closely spaced, so once a clay-based mud loads them up, grip disappears fast. In proper mud you want something more aggressive, or wider spacing."),
        h(2, 'Verdict'),
        p("For a one-bike garage, a supple 42 mm tubeless gravel tire is a remarkable default. It's 90% as fast as a road tire on tarmac and 200% more enjoyable everywhere else. I'm keeping them on the winter bike, and I'm seriously considering fitting a second set to my summer bike too."),
      ],
    },
  },
  {
    slug: 'lube-your-chain-properly',
    author_id: USERS[1].id,
    title: 'How to lube your chain properly (and why most people get it wrong)',
    excerpt: 'A clean chain runs quieter, shifts better, and lasts two to three times longer. Here is the routine I recommend to anyone who will listen.',
    cover_image_url: '/blog-covers/lube-your-chain-properly.avif',
    category: 'maintenance_guide',
    published_days_ago: 8,
    tag_slugs: ['maintenance', 'drivetrain'],
    content: {
      type: 'doc',
      content: [
        p("In five years as a shop mechanic I saw more chains worn to stretch by poor lubing than by mileage. Most people either skip lubing entirely or, more commonly, over-lube and never clean. Both kill drivetrains. The good news: the correct routine is quick, cheap, and boring."),
        h(2, "The principle"),
        p("Chain lube lives inside the rollers, not on the outside. Everything on the outside is just dirt-magnet. Your job is to get lube in, then wipe the outside dry."),
        h(2, 'Routine for dry conditions'),
        ol(
          'Run the chain backwards through a rag to wipe surface grime off each link.',
          'Apply one drop of dry wax-based lube to each roller while slowly pedalling backwards. One drop per roller, no more.',
          'Cycle through every gear so the lube distributes.',
          'Let it sit for 15-30 minutes so the solvent carrier evaporates.',
          'Wipe the entire chain firmly with a clean rag. You should see very little lube on the rag.',
        ),
        h(2, 'Routine for wet conditions'),
        p("Same thing, but use wet lube, and re-lube after any ride that soaked the drivetrain. Water carries away lube much faster than dust does."),
        h(2, 'The part everyone skips'),
        pRich(
          { text: "Every 3 to 5 lube cycles, ", bold: false },
          { text: 'actually clean the chain.', bold: true },
        ),
        p("Remove it (or use an on-bike degreaser tank), scrub the cassette, scrub the chainrings, then re-lube. A filthy chain with fresh lube on top is just grinding paste."),
        h(2, 'Signs you are doing it wrong'),
        ul(
          'Your chain is black and shiny: too much lube, not enough wiping.',
          'Your chain is dry and clicky: not enough lube, or your lube is not reaching the rollers.',
          'Your cassette cogs have a ring of black sludge at the base of the teeth: this is dirt-lube paste.',
          'You feel sand-like grit when you pinch the chain between your fingers: time to clean, not re-lube.',
        ),
        quote("A good chain run at 60% load (cleaned regularly) will outlive three chains run at 100% load (never cleaned). It is the single highest-leverage maintenance habit in cycling."),
        h(2, 'Tools I actually use'),
        p("Nothing fancy: a pack of shop rags, one bottle of wax-based dry lube, one bottle of wet lube for winter, a chain wear gauge (not optional), and a small scrub brush. Total cost, around €40, replacing the lube once a year. The chain wear gauge pays for itself on its first use."),
      ],
    },
  },
  {
    slug: 'dolomites-by-bike',
    author_id: USERS[2].id,
    title: '7 hours, 134 km, 2,100 m of climbing: the Dolomites by bike',
    excerpt: 'A ride report from a loop that I underestimated, regretted, and would absolutely do again.',
    cover_image_url: '/blog-covers/dolomites-by-bike.avif',
    category: 'ride_report',
    published_days_ago: 11,
    tag_slugs: ['ride-report', 'climbing', 'road', 'long-distance'],
    content: {
      type: 'doc',
      content: [
        p("I planned this loop on a Wednesday evening, looking at a map and thinking 'that looks doable.' It was doable. It was not pleasant for the last 25 km, but that's usually how I know a ride was worth doing."),
        h(2, 'The route'),
        p('Starts in Cortina d\'Ampezzo. Up to Passo Giau (2,236 m), down through Selva di Cadore, up again to Passo Falzarego, and back. On paper: 134 km and 2,100 m of climbing. In practice: a lot of 10% and above gradients, one punishing descent into a headwind, and a final 12 km that I will remember forever.'),
        h(2, 'The first climb'),
        pRich(
          { text: "Giau is not long by Alpine standards, about 10 km from Pocol, but it is ", bold: false },
          { text: "relentless", bold: true, italic: true },
          { text: ". There is no part where you can recover. The average gradient is 9.3% and there are sections where I looked down and saw 13%.", bold: false },
        ),
        p("I rode it in my 34-32 at around 65 rpm, which is not an efficient cadence for me, but in the hot sun at 2000 m altitude I did not have the lungs for anything higher."),
        h(2, 'Where I broke'),
        p("It was not on Giau. It was on the way back to Cortina, 120 km in, on a false flat that I expected to be recovery but turned out to be into a 25 km/h headwind. I watched my average speed drop for 40 minutes and felt my legs turn into something unhelpful."),
        quote("Every long ride has a moment where you decide whether to keep going or break yourself doing it. Today's moment arrived later than usual, which I will take as progress."),
        h(2, 'What worked'),
        ul(
          'Carrying 2 L of water instead of 1 L. I finished the first bottle by Pocol.',
          'Eating early: I took my first gel at 40 minutes. The ride was too hard for "I\'ll eat when I\'m hungry."',
          'Switching to a 36-tooth cassette from my usual 32. I would have walked otherwise.',
        ),
        h(2, "What didn't"),
        ul(
          'Starting at 09:00 instead of 07:00. By the time I was on Falzarego it was 32°C.',
          "Thinking I could skip the gilet on the descent. Dolomite descents are cold even in August.",
          "My planning. I should have added a mid-route resupply stop to the route, not just a 'there will probably be fountains' assumption.",
        ),
        h(2, 'Would I do it again?'),
        p("Yes, but earlier in the morning, with one more water bottle, and with somebody to share the pulls into that headwind. It is a spectacular piece of road and I think it is worth arriving early for the light alone."),
      ],
    },
  },
  {
    slug: 'switched-to-disc-brakes',
    author_id: USERS[3].id,
    title: 'Why I finally switched from rim brakes to discs',
    excerpt: "I held out for years. I was wrong, but not for the reasons disc fans usually give.",
    cover_image_url: '/blog-covers/switched-to-disc-brakes.avif',
    category: 'general',
    published_days_ago: 15,
    tag_slugs: ['road', 'review'],
    content: {
      type: 'doc',
      content: [
        p("For five years I told anyone who would listen that disc brakes on road bikes were marketing. They were heavier, more expensive, harder to service, and I already had brakes that stopped me from hitting things. I was not interested."),
        p("Then I bought a bike with them, mostly because I liked the bike. And I changed my mind."),
        h(2, 'The common arguments I did not buy'),
        pRich(
          { text: "I think most of the ", bold: false },
          { text: "pro-disc arguments are overblown", bold: true },
          { text: ".", bold: false },
        ),
        ul(
          'Modulation: good rim brakes modulate fine with good pads in the dry.',
          'Stopping power: I have never had a rim-brake road bike fail to stop me.',
          'Rim wear: replacement rims exist and cost less than a pair of rotors and pads.',
        ),
        p("If you only ride in the dry, on tarmac, on a bike that doesn't see many descents, rim brakes are still genuinely fine. The marketing has oversold the decisive victory."),
        h(2, 'What actually sold me'),
        p("Wet descending. Specifically, the first 10 seconds of wet descending."),
        p("With carbon rim brakes, there is a lag between pulling the lever and the pads clearing water off the rim. On a dry day it's fractions of a second. On a cold wet day it can be a full second, and on a long descent that lag compounds every time you tap the levers through a corner."),
        p("Disc brakes have no such lag. The first squeeze of the lever produces the same bite as the last, in any conditions. It is the kind of thing I did not realise I wanted until I rode a long wet descent without it. Then I wanted nothing else."),
        quote("I have crashed exactly twice on bikes in the last decade, and both were wet-descent corners where I got on the brakes late. I still think about those when I'm descending in the rain. Discs do not make me faster but they make me less frightened, and that is worth quite a lot."),
        h(2, 'The other benefit, which surprised me'),
        p("Tire clearance. Disc frames tend to allow more tire, because the brake is no longer clamped around the rim. My current bike takes 34 mm tires without complaint. That single change, running 32 mm tubeless at 4.5 bar instead of 25 mm at 7 bar, made a bigger difference to my riding than any other upgrade in the last five years."),
        h(2, 'What still annoys me'),
        ul(
          'Rotor rub. Eight months in, I still chase it occasionally.',
          'Bleeding. It is not hard, but it is finicky, and I miss the simplicity of a cable.',
          "Through-axles. They're fine, but they add 30 seconds to every wheel change, which adds up on a weekend of mechanicals.",
        ),
        h(2, 'Verdict'),
        p("I will not go back. Not because discs are universally better, but because for the way I ride (year-round, in weather, on long descents), they solve a real problem I did not fully appreciate I had. If your riding is summer-only on smooth roads, I would not sweat it."),
      ],
    },
  },
  {
    slug: 'replacing-a-chain-step-by-step',
    author_id: USERS[1].id,
    title: 'Replacing a chain: step-by-step, with torque specs',
    excerpt: "It takes 15 minutes and saves you from replacing the whole drivetrain six months later. If you can use a multi-tool, you can do this.",
    cover_image_url: '/blog-covers/replacing-a-chain-step-by-step.avif',
    category: 'maintenance_guide',
    published_days_ago: 21,
    tag_slugs: ['maintenance', 'drivetrain'],
    content: {
      type: 'doc',
      content: [
        p("A chain is cheap. A cassette is not. A chainring is not. Replacing a chain at the right time is the cheapest serious maintenance job in cycling, and it is easy to do badly."),
        h(2, 'When to replace'),
        p("Use a chain-wear gauge. They are 10-15 euros and they pay for themselves the first time. Replace at 0.5% wear for 11-speed and faster, 0.75% for 10-speed or slower. By the time your chain skips on the cassette under load, you have already worn the cassette."),
        h(2, 'What you need'),
        ul(
          'New chain, correct speed rating (11-speed chain for 11-speed drivetrain)',
          'Chain tool',
          'Quick-link pliers (not strictly required, but makes life easier)',
          'Chain wear gauge',
          'Rags',
        ),
        h(2, 'The steps'),
        ol(
          'Clean the drivetrain. Degreaser on the old chain, run it backwards, wipe it dry. You want to see what you are doing.',
          'Check cassette wear by running the chain on the outer cog under light load. If it skips, you need a cassette too. The new chain will not mesh with a worn cassette.',
          'Count the links on the old chain. Write the number down.',
          'Lay the new chain next to the old one. Size the new chain to the same number of full links. Do not eyeball this. Count.',
          'Break the new chain to length using your chain tool. Push the pin out most of the way but not all the way through. You will need it if the chain is too short.',
          'Thread the new chain through the derailleur in the correct orientation (most chains have a direction arrow; orient it in the direction of drive rotation on the drive-side).',
          'Join the chain with the quick link. Squeeze the two halves together, then apply tension by pedalling forward. The link clicks into place.',
          'Visually inspect the quick link from both sides. It should sit flush, with no gap at the pins.',
          'Run through all gears twice. Check for skipping under load.',
        ),
        h(2, 'Torque specs'),
        p("A chain itself has no torque spec: it's pressed, not bolted. But if you are replacing a cassette at the same time:"),
        ul(
          'Cassette lockring: 40 Nm',
          'Chainring bolts (alloy): 12-14 Nm',
          'Chainring bolts (steel): 14-16 Nm',
          'Rear derailleur bolt: 8-10 Nm',
          'Rear wheel axle (through-axle): 12-15 Nm',
        ),
        p("Check your component manufacturer's site for exact numbers. The above are typical ranges."),
        h(2, 'Common mistakes'),
        ul(
          "Sizing the chain too short: it will snap on the big-big combination.",
          "Sizing it too long: the derailleur cage cannot take up the slack, the chain sags in the small cog.",
          "Reusing an old quick link. Most are single-use.",
          "Forgetting to check cassette wear before installing a new chain. Then it skips under load and you think the chain is defective.",
        ),
        quote("If you are nervous, do this at home in your kitchen on a workday. Bad chain installations happen on the road at the worst possible time. Fix them on a table, with a beer, and no time pressure."),
      ],
    },
  },
  {
    slug: 'year-with-the-tarmac-sl7',
    author_id: USERS[0].id,
    title: 'A year with the Specialized Tarmac SL7: an honest review',
    excerpt: "A full season and a winter of abuse. What held up, what didn't, and whether I'd buy another.",
    cover_image_url: '/blog-covers/year-with-the-tarmac-sl7.avif',
    category: 'review',
    published_days_ago: 28,
    tag_slugs: ['review', 'road'],
    content: {
      type: 'doc',
      content: [
        p("I bought the Tarmac SL7 Expert in March last year. It has done a bit over 8,000 km since then: Italian classics, two summer weeks in France, a winter of wet commutes, and about a dozen group rides that were faster than I wanted them to be."),
        p("This is an actual-use review, not a factory test. The short version: it is an excellent bike, with some real frustrations."),
        h(2, 'What it does well'),
        ul(
          'Climbing. The frame is stiff in the right places and it responds to out-of-saddle efforts like a much lighter bike.',
          'Descending. Stable and predictable. I trust it at speed in a way I did not trust my previous bike.',
          'Comfort over long days. I was sceptical of the aero tube shapes, but rides over 5 hours have been fine.',
          "Handling in the wet. The disc brakes and the tire clearance matter here.",
        ),
        h(2, 'What it does not'),
        pRich(
          { text: 'Internal cabling is a ', bold: false },
          { text: 'pain', bold: true, italic: true },
          { text: ' to service.', bold: false },
        ),
        p("I had the cables replaced at 6,000 km and the shop charged me nearly double what they would for an external-routed bike. If you are comfortable doing your own work, factor in a day of frustration or a workshop visit."),
        p("The proprietary seatpost also developed a creak that took three shop visits to isolate. It turned out to be the clamp, not the post, but the fix required grease, torque, and a rain test to confirm."),
        h(2, 'Parts that failed'),
        ul(
          'Bottom bracket: developed a creak at 5,000 km. Replaced at 6,500 km. Not surprising.',
          'Rear derailleur hanger: bent on a careful gravel detour. Replaced for €40. Normal.',
          "Rear shifter: started missing shifts at 7,500 km. Not yet fixed: suspected cable fray inside the bar.",
          'Tires: I got through four pairs this year, mostly puncture-driven. Tire choice is on me, not the bike.',
        ),
        h(2, 'Parts that impressed me'),
        ul(
          'Frame: no creaks, no cracks, no worrying flex. Zero complaints.',
          'Brakes: still feel as sharp as day one after a winter of wet riding.',
          'Wheels: trued once, still spinning straight.',
        ),
        quote("I like this bike more now than I did at six months. Most bikes I have owned have gone the other way: they fade as the shine wears off and the quirks grate. This one has grown on me as I have learned its habits."),
        h(2, 'Would I buy another?'),
        p("Yes, with two caveats. First, I would not buy one if I was planning to do my own cable work; it's genuinely more painful than a conventional bike. Second, I would budget for consumables: this is an expensive bike to run, not just to buy. But as a ride-every-day race bike, it has earned its place in my garage."),
      ],
    },
  },
  {
    slug: 'coffee-shop-ride-etiquette',
    author_id: USERS[3].id,
    title: 'Coffee-shop ride etiquette, and other things nobody tells you',
    excerpt: "Showing up for your first Saturday group ride is intimidating. Here is the unwritten rulebook, as plainly as I can put it.",
    cover_image_url: '/blog-covers/coffee-shop-ride-etiquette.avif',
    category: 'general',
    published_days_ago: 32,
    tag_slugs: ['road'],
    content: {
      type: 'doc',
      content: [
        p("I've been riding with the same Saturday group for four years. When I joined I knew almost nobody, I didn't know the routes, and I certainly didn't know the rules, and there are rules. Nobody tells you them explicitly, because long-time riders have internalised them to the point of forgetting they exist. So here is the unwritten rulebook, written down."),
        h(2, 'Before the ride'),
        ul(
          "Show up five minutes early. The ride leaves on the advertised time, not five minutes after.",
          "Have your bike ready. Tires pumped, bottles filled, computer paired. Sorting these at the start point is a group-ride crime.",
          'Introduce yourself if you are new. Nobody will think less of you. They will think less of you if you show up, say nothing, and then drop them on the first climb.',
        ),
        h(2, 'In the group'),
        pRich(
          { text: "The single most important rule: ", bold: false },
          { text: "do not overlap wheels", bold: true },
          { text: ". Everything else flows from this.", bold: false },
        ),
        p("If your front wheel is next to someone else's rear wheel, and they move sideways, you go down. And because group rides move in close formation, the person behind you goes down too. Keep your front wheel behind their rear wheel, with a small gap."),
        ul(
          'Point out hazards. Potholes, gravel, parked cars. A flat hand gesture down to the side is enough.',
          'Call out directions. "Car back," "Car up," "Clear" at junctions, "Easy" when slowing, "Stopping" when stopping.',
          'If you come to the front, do your turn and pull off. Longer turns are not helpful to anyone.',
          "Don't half-wheel. If you come alongside a rider at the front, stay level with them, not slightly ahead. It's the surest way to make a ride feel like a race when it shouldn't.",
        ),
        h(2, 'At the café'),
        p("Most group rides end at a café. This is a social contract as much as a bike ride."),
        ul(
          'Order at the bar, not the table, if it is busy. Tip if that is the local convention.',
          "Don't be the rider who orders a filter coffee, pays with a 50, and holds up the queue.",
          "Lock your bike or keep it visible. Cafés near popular ride routes occasionally lose bikes.",
          'Stay for at least one drink. The café is half the reason the ride exists.',
        ),
        h(2, 'The ride home'),
        p("Some people ride home after. Some people wait for the next group. Both are fine. What is not fine is leaving without saying goodbye. Rides are social, and so are their endings."),
        quote("Group rides teach you things no solo ride can. How to ride with people bigger and faster than you. How to descend in a line. How to ask for a pull when your legs are gone. These skills do not show up anywhere else."),
        p("And if the Saturday group feels intimidating the first time, try the Tuesday recovery ride instead. The rules are the same. The pace is slower. And the coffee is usually just as good."),
      ],
    },
  },
  {
    slug: 'mont-ventoux-in-34-celsius',
    author_id: USERS[2].id,
    title: 'Climbing Mont Ventoux in 34°C: what I learned the hard way',
    excerpt: "I thought I had prepared for the heat. I had not. Here is the ride, and here is what I would do differently.",
    cover_image_url: '/blog-covers/mont-ventoux-in-34-celsius.avif',
    category: 'ride_report',
    published_days_ago: 40,
    tag_slugs: ['ride-report', 'climbing', 'road', 'long-distance'],
    content: {
      type: 'doc',
      content: [
        p("Mont Ventoux is famous for being barren, exposed, and windy. When I rode it, it was 34°C in the shade, and there is no shade on Ventoux. What follows is not a glamorous ride report. It is a story about misjudging the weather and surviving the consequences."),
        h(2, 'The plan'),
        p("Start from Bédoin, the traditional side. 21 km, 1,600 m of climbing. Average gradient 7.5%, with a long 10% section in the forest and the exposed upper moonscape for the final 6 km. I had studied the profile. I was ready for the elevation. I was not ready for the heat."),
        h(2, 'The first 6 km'),
        p("Gentle. 4-5%. I set a pace I could hold all day, drank one bottle, and told myself this was going to be fun."),
        h(2, 'The forest'),
        p("This is the hardest part of Ventoux on a normal day: 10 km of relentless 9-10%, in the trees, with no view to distract you. At 34°C in the trees, the air was completely still and the road radiated like an oven. I watched my heart rate climb 15 bpm without going any faster."),
        pRich(
          { text: "I drank my second bottle before the forest ended. That was a ", bold: false },
          { text: "mistake", bold: true, italic: true },
          { text: " I did not realise until later.", bold: false },
        ),
        h(2, 'Chalet Reynard'),
        p("The tree line ends at Chalet Reynard. The last 6 km are exposed, with crosswinds and the famous white-rock moonscape. I stopped at the chalet and filled both bottles. I drank half of one there while the lady behind the counter watched me, unimpressed."),
        p("It was 35°C in the sun. I had 6 km and 550 m of climbing to go."),
        h(2, 'The top'),
        p("I do not remember the last 3 km clearly. I remember stopping twice, once pretending to check my gearing, once actually checking whether I was going to throw up. I finished. I sat on the wall next to the summit sign for 20 minutes, drinking water and not speaking to anyone."),
        quote("The summit of Ventoux is one of the most iconic climbs in cycling. I spent my time at the top thinking only about descending in one piece. I do not have a better photograph to show for it than a blurry phone shot I took for proof."),
        h(2, 'What I would do differently'),
        ol(
          'Leave at 06:30, not 10:00. By the time I was in the forest it was already 30°C.',
          'Carry three bottles, not two. Or an extra 500 ml flask.',
          "Eat earlier and more often. I had two gels on the whole climb. I needed four.",
          'Stop at Chalet Reynard coming up, even if you feel fine. The 15 minutes you lose is worth the hydration you gain.',
          'Descend slowly. I was dangerous on the descent because I was cooked. Take time at the top to recover.',
        ),
        h(2, 'Would I do it again?'),
        p("Yes. In April, or in October. Not in August. The climb deserves a day when the weather is not actively trying to end you. I owe it a rematch under better conditions."),
      ],
    },
  },
  {
    slug: 'the-case-for-full-fenders',
    author_id: USERS[5].id,
    title: 'The case for full fenders (and why clip-ons are a trap)',
    excerpt: 'Every winter the same argument resurfaces. After five years of year-round commuting in the rain, here is why I run full-coverage fenders and nothing less.',
    cover_image_url: '/blog-covers/the-case-for-full-fenders.avif',
    category: 'general',
    published_days_ago: 6,
    tag_slugs: ['commuting', 'gear', 'winter'],
    content: {
      type: 'doc',
      content: [
        p("There is a particular kind of wet that only a rear wheel can produce: a fine vertical stripe up your back, applied steadily for the length of your commute. Clip-on fenders do almost nothing about it."),
        h(2, 'Coverage is the whole point'),
        p("A full fender wraps most of the wheel, with a mudflap that reaches close to the road. That last 10 cm of flap is what keeps spray off your feet and off the rider behind you. Half-length clip-ons skip exactly the part that matters."),
        ul(
          'Mount points: get a bike with eyelets, or use proper p-clamps, not zip ties.',
          'Mudflaps: longer is always better, both front and rear.',
          'Clearance: leave room for the mud, or they pack and rub.',
        ),
        p("They are unfashionable and they add weight. They are also the single best quality-of-life upgrade for anyone who rides through a real winter."),
      ],
    },
  },
  {
    slug: 'tubeless-setup-that-actually-works',
    author_id: USERS[1].id,
    title: 'A tubeless setup that actually seats on the first try',
    excerpt: 'Tubeless is great when it works and miserable when it does not. Here is the repeatable process I use so the tire seats, holds air, and stops weeping sealant by morning.',
    cover_image_url: '/blog-covers/tubeless-setup-that-actually-works.avif',
    category: 'maintenance_guide',
    published_days_ago: 11,
    tag_slugs: ['maintenance', 'tires', 'gear'],
    content: {
      type: 'doc',
      content: [
        p("Most tubeless horror stories come from skipping steps, not from the technology. Do these in order and the failure rate drops to near zero."),
        h(2, 'The process'),
        ol(
          'Tape the rim with the correct width, one clean wrap, stretched tight, overlapping the valve hole.',
          'Fit one bead, install the valve, then fit the second bead leaving a small section open.',
          'Pour in the right volume of sealant, then finish seating the bead by hand.',
          'Inflate fast with a compressor or a tubeless pump until both beads pop into place.',
          'Drop to riding pressure, shake the wheel to spread sealant, and leave it overnight.',
        ),
        h(2, 'The part everyone skips'),
        p("Clean the rim before taping. Any old residue and the tape will lift, the seal will fail, and you will blame the tire. It is never the tire."),
      ],
    },
  },
  {
    slug: 'first-200k-brevet',
    author_id: USERS[6].id,
    title: 'My first 200 km brevet: slower is faster',
    excerpt: 'A 200 km randonnee is not a race, but it punishes the same mistakes a race does. What I got wrong, and the two things that got me to the final control before the cutoff.',
    cover_image_url: '/blog-covers/first-200k-brevet.avif',
    category: 'ride_report',
    published_days_ago: 16,
    tag_slugs: ['long-distance', 'ride-report', 'training'],
    content: {
      type: 'doc',
      content: [
        p("Two hundred kilometres sounds like a number until you are at kilometre 150 with a headwind and a control card that needs another stamp. Then it becomes a lesson in patience."),
        h(2, 'What slowed me down'),
        p("I started too fast. The first 60 km felt easy, so I rode them like they were free. They were not. By the halfway control I had spent matches I needed for the back half."),
        h(2, 'What saved me'),
        p("Eating on a timer, not on appetite, and refusing to stop for longer than five minutes at any control. Momentum is everything on a long day. The riders who finish are the ones who keep the stops short."),
        quote("Ride the first half with your head and the second half with your legs. I had it backwards."),
      ],
    },
  },
  {
    slug: 'fixed-gear-in-the-city',
    author_id: USERS[7].id,
    title: 'Why I still commute on a fixed gear',
    excerpt: 'A fixed-gear bike in city traffic teaches you to read the road further ahead than any other bike. A defence of the simplest drivetrain there is.',
    cover_image_url: '/blog-covers/fixed-gear-in-the-city.avif',
    category: 'general',
    published_days_ago: 22,
    tag_slugs: ['commuting', 'road'],
    content: {
      type: 'doc',
      content: [
        p("People assume fixed gear is about looking a certain way. For me it is about attention. When you cannot freewheel, you plan every gap and every light a hundred metres earlier."),
        h(2, 'The maintenance argument'),
        p("One cog, one chainring, one chain. No derailleurs to adjust, no cables to fray, nothing to clatter loose in the cold. In winter that simplicity is worth more than any gear range."),
        p("It is not the right bike for hills or for everyone. But for a flat city commute it is honest, quiet, and almost impossible to break."),
      ],
    },
  },
  {
    slug: 'choosing-an-enduro-bike',
    author_id: USERS[8].id,
    title: 'Choosing an enduro bike without overbuying',
    excerpt: 'It is easy to spend a fortune on travel and electronics you will never use. Here is how I would pick an enduro bike today, working from the trail backwards.',
    cover_image_url: '/blog-covers/choosing-an-enduro-bike.avif',
    category: 'review',
    published_days_ago: 28,
    tag_slugs: ['mtb', 'review', 'gear'],
    content: {
      type: 'doc',
      content: [
        p("The marketing wants you to buy travel and a motorised drivetrain. The trail wants you to buy geometry and brakes. Start with the trail."),
        h(2, 'What actually matters'),
        ul(
          'Geometry that suits your local trails, not a bike-park lift line you ride twice a year.',
          'Brakes with four pistons and big rotors. This is not where you save weight.',
          'Suspension you will actually set up and service, not the most expensive option.',
        ),
        p("A well-set-up mid-tier bike beats a poorly-set-up flagship every single ride. Spend the saved money on a suspension service and a riding holiday."),
      ],
    },
  },
  {
    slug: 'bikepacking-the-algarve',
    author_id: USERS[9].id,
    title: 'Bikepacking the Algarve in the off-season',
    excerpt: 'Four days, one frame bag, and a coastline that empties out once the tourists leave. A loose route report from the south of Portugal in November.',
    cover_image_url: '/blog-covers/bikepacking-the-algarve.avif',
    category: 'ride_report',
    published_days_ago: 34,
    tag_slugs: ['bikepacking', 'touring', 'ride-report'],
    content: {
      type: 'doc',
      content: [
        p("November in the Algarve is the secret. The light is low and golden, the cafes are still open, and the dirt roads above the coast belong entirely to you."),
        h(2, 'The kit'),
        p("Frame bag, small saddle pack, and a half-frame of tools. I carried too much water and not enough coffee money, which is the correct ratio to get wrong."),
        h(2, 'The route'),
        p("Inland on dirt, back to the coast each evening. The climbs are short but constant, and the surface ranges from smooth gravel to chunky limestone that rattled everything loose by day three."),
        p("If you only have a long weekend and a gravel bike, this is the trip I would point you at first."),
      ],
    },
  },
  {
    slug: 'how-to-bleed-disc-brakes',
    author_id: USERS[1].id,
    title: 'Bleeding disc brakes without making a mess',
    excerpt: 'A clean brake bleed is mostly about preparation and patience. The full procedure, the mistakes that introduce air, and how to know when you are actually done.',
    cover_image_url: '/blog-covers/how-to-bleed-disc-brakes.avif',
    category: 'maintenance_guide',
    published_days_ago: 41,
    tag_slugs: ['maintenance', 'gear'],
    content: {
      type: 'doc',
      content: [
        p("A spongy lever almost always means air in the system. Bleeding sounds intimidating, but it is a slow, tidy job if you set up properly first."),
        h(2, 'Before you start'),
        ul(
          'Use the correct fluid for your brand. Mineral oil and DOT are not interchangeable.',
          'Level the bike so the lever is the highest point. Air rises to where you can push it out.',
          'Protect the pads and rotor. Fluid contamination means new pads, every time.',
        ),
        h(2, 'Knowing you are done'),
        p("Push fluid through until no bubbles appear at the lever, then close up and pump. The lever should come up firm and stay there. If it sinks, there is still air, and you start again."),
      ],
    },
  },
  {
    slug: 'power-meter-first-season',
    author_id: USERS[2].id,
    title: 'A power meter changed how I train. Here is the honest review',
    excerpt: 'After one season training with power instead of feel, the numbers confirmed some things and quietly demolished others. What it is worth, and what it is not.',
    cover_image_url: '/blog-covers/power-meter-first-season.avif',
    category: 'review',
    published_days_ago: 49,
    tag_slugs: ['training', 'gear', 'review'],
    content: {
      type: 'doc',
      content: [
        p("I resisted a power meter for years. Feel had got me this far, I argued. Then I trained with one for a season and learned that my feel was confidently wrong about half the time."),
        h(2, 'What it fixed'),
        p("Pacing. On long climbs I used to start too hard and fade. Watching a number kept me honest in a way that perceived effort never managed."),
        h(2, 'What it did not fix'),
        p("Motivation, recovery, or the weather. A power meter measures output, not readiness. Some of my best days were low-number days, and the meter had nothing useful to say about why."),
        quote("It is a brilliant pacing tool and a mediocre coach. Treat it as the former."),
      ],
    },
  },
  {
    slug: 'wheel-truing-basics',
    author_id: USERS[1].id,
    title: 'Wheel truing for people who have never touched a spoke',
    excerpt: 'A slightly buckled wheel is not a reason to buy a new one. The basics of truing, the one rule that keeps you out of trouble, and when to stop and visit a shop.',
    cover_image_url: '/blog-covers/wheel-truing-basics.avif',
    category: 'maintenance_guide',
    published_days_ago: 57,
    tag_slugs: ['maintenance', 'wheels'],
    content: {
      type: 'doc',
      content: [
        p("A wheel goes out of true gradually, then all at once after a pothole. The good news is that small corrections are well within reach of a patient beginner."),
        h(2, 'The one rule'),
        p("Small turns. A quarter turn of a spoke nipple is a lot. Work in eighths, check often, and approach the wobble from both sides rather than yanking one spoke tight."),
        h(2, 'When to stop'),
        p("If the rim has a flat spot, a crack, or spokes that ping at wildly different tensions, stop. That is a wheel for a shop with a tension meter, not a roadside fix."),
      ],
    },
  },
  {
    slug: 'cassette-vs-climbing',
    author_id: USERS[3].id,
    title: 'I finally fitted an easier cassette and my ego survived',
    excerpt: 'For years I rode gearing that was too hard for the hills near me, out of pride. Swapping to a wider-range cassette was the cheapest performance upgrade I have made.',
    cover_image_url: '/blog-covers/cassette-vs-climbing.avif',
    category: 'general',
    published_days_ago: 64,
    tag_slugs: ['climbing', 'drivetrain', 'gear'],
    content: {
      type: 'doc',
      content: [
        p("There is a strange machismo about gearing. For a long time I refused an easier cassette because real cyclists grind, apparently. Real cyclists also walk up climbs they geared themselves out of."),
        h(2, 'The change'),
        p("I went to a wider-range cassette and a slightly smaller chainring. The bike got no slower on the flat and suddenly the local climbs were rideable seated, in a rhythm, instead of a survival effort."),
        p("Cadence is free speed on a long climb. There is nothing virtuous about cracking at the bottom of a wall because the gear was too big."),
      ],
    },
  },
  {
    slug: 'winter-base-training',
    author_id: USERS[2].id,
    title: 'What winter base training actually looks like',
    excerpt: 'Base season is not glamorous and it is not all slow. A plain-language look at how I structure the dark months so spring fitness is not an accident.',
    cover_image_url: '/blog-covers/winter-base-training.avif',
    category: 'general',
    published_days_ago: 73,
    tag_slugs: ['training', 'winter', 'road'],
    content: {
      type: 'doc',
      content: [
        p("Base training has a reputation for being endless slow miles. The reality is more boring and more effective: mostly easy, with just enough intensity to keep the top end from disappearing."),
        h(2, 'The shape of a week'),
        ul(
          'Two or three easy endurance rides, genuinely easy, conversation-pace.',
          'One ride with short, sharp efforts to keep the legs awake.',
          'Rest that is actually rest, not easy riding pretending to be rest.',
        ),
        p("Consistency beats heroics here. Three sustainable months put you somewhere real by March. Three brilliant weeks followed by a cold do not."),
      ],
    },
  },
  {
    slug: 'trail-building-ethics',
    author_id: USERS[4].id,
    title: 'Build trails the way you want to find them',
    excerpt: 'Volunteering on the local trail crew taught me more about riding than any skills course. A few principles for anyone thinking about picking up a shovel.',
    cover_image_url: '/blog-covers/trail-building-ethics.avif',
    category: 'general',
    published_days_ago: 86,
    tag_slugs: ['mtb'],
    content: {
      type: 'doc',
      content: [
        p("The trails you love were built and maintained by someone, usually for free, often in the rain. Spend one day on a trail crew and you will never look at a berm the same way again."),
        h(2, 'A few rules'),
        ul(
          'Dig with permission. Rogue trails get whole networks closed.',
          'Build for water first. Drainage is what makes a trail last a winter.',
          'Leave it better than you found it, every single session.',
        ),
        p("Riding is taking. Trail work is giving some of it back, and it makes you a smoother rider in the bargain because you finally understand why the trail is shaped the way it is."),
      ],
    },
  },
  {
    slug: 'commuter-tire-comparison',
    author_id: USERS[5].id,
    title: 'Three commuter tires, one rainy winter: a comparison',
    excerpt: 'I ran three popular commuter tires back to back through a wet British winter and tracked every puncture. The results were not what the reviews promised.',
    cover_image_url: '/blog-covers/commuter-tire-comparison.avif',
    category: 'review',
    published_days_ago: 97,
    tag_slugs: ['commuting', 'tires', 'review'],
    content: {
      type: 'doc',
      content: [
        p("Commuter tire reviews are usually written by people who do not commute on them in January. I ran three sets through one wet winter and counted every flat."),
        h(2, 'The trade-off nobody admits'),
        p("The fastest tire flatted the most. The slowest, heaviest tire did not puncture once but felt like riding through wet sand. The middle option was, predictably, the one to buy."),
        h(2, 'The verdict'),
        p("For commuting, puncture protection beats rolling resistance every time. A flat on a cold dark morning costs you far more than a few watts ever will."),
      ],
    },
  },
  {
    slug: 'first-century-ride',
    author_id: USERS[0].id,
    title: 'My first 100-mile day, and what it taught me about fuelling',
    excerpt: 'The legs were ready. The stomach was not. A ride report from my first century, and the surprisingly small change that turned the last 20 miles around.',
    cover_image_url: '/blog-covers/first-century-ride.avif',
    category: 'ride_report',
    published_days_ago: 112,
    tag_slugs: ['road', 'ride-report', 'long-distance'],
    content: {
      type: 'doc',
      content: [
        p("I had trained for the distance. What I had not trained was eating on the bike for six hours straight, and by mile 75 my stomach had filed a formal complaint."),
        h(2, 'The wall was not in my legs'),
        p("People talk about the wall as a leg thing. Mine was entirely digestive. I had eaten too many sweet gels and nothing savoury, and my body simply refused the next one."),
        h(2, 'The fix'),
        p("A cheese sandwich from a petrol station at mile 80. Real food, a bit of salt, and twenty minutes later I was riding again. I finished on sandwiches, not gels."),
        quote("Train your stomach like you train your legs. It is the part that quits first."),
      ],
    },
  },
  {
    slug: 'chain-wear-checking',
    author_id: USERS[1].id,
    title: 'Check your chain before it eats your cassette',
    excerpt: 'A worn chain is cheap. The cassette and chainrings it destroys are not. How to check chain wear in thirty seconds and when to replace.',
    cover_image_url: '/blog-covers/chain-wear-checking.avif',
    category: 'maintenance_guide',
    published_days_ago: 131,
    tag_slugs: ['maintenance', 'drivetrain'],
    content: {
      type: 'doc',
      content: [
        p("A chain is a wear item that quietly takes the cassette and chainrings with it if you ignore it. The whole inspection takes less time than pumping up a tire."),
        h(2, 'How to check'),
        p("Use a chain wear gauge. When it reads past the 0.5 mark on most modern drivetrains, the chain is done. Replace it then and the cassette lives on. Wait until it skips under load and you are buying everything."),
        h(2, 'The economics'),
        ul(
          'A chain costs a little and takes ten minutes.',
          'A chain plus cassette costs several times more.',
          'A chain plus cassette plus chainrings is a small bike service.',
        ),
        p("Check it monthly if you ride a lot. It is the cheapest insurance in cycling."),
      ],
    },
  },
  {
    slug: 'gravel-race-recap',
    author_id: USERS[8].id,
    title: 'First gravel race: dropped, lost, and hooked',
    excerpt: 'I went into my first gravel race expecting a hard ride. I got dropped in the first hour, took a wrong turn, and finished grinning. A recap of a brilliant disaster.',
    cover_image_url: '/blog-covers/gravel-race-recap.avif',
    category: 'ride_report',
    published_days_ago: 158,
    tag_slugs: ['gravel', 'racing', 'ride-report'],
    content: {
      type: 'doc',
      content: [
        p("Gravel racing is road racing with the politeness removed and the navigation added. I had done neither, so naturally I signed up for a long one."),
        h(2, 'The first hour'),
        p("The front group rode away on a climb I had no answer for. By the first feed I was alone, which turned out to be the best thing that happened all day."),
        h(2, 'Alone, but happy'),
        p("Riding my own pace through empty forest, navigating off the route sheet, stopping to actually look at the view. I took a wrong turn that cost ten minutes and I did not even mind."),
        p("I finished mid-pack and immediately looked up the next one. That is the trap, and I walked straight into it."),
      ],
    },
  },
];

// Deterministic PRNG (mulberry32) so generated bikes/maintenance/rides are the
// same on every fresh seed. Avoids Math.random so re-runs are reproducible.
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = makeRng(20260615);
const randInt = (min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));
function pick<T>(items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('pick() called with an empty array');
  return item;
}
const chance = (probability: number): boolean => rng() < probability;
const userAt = (index: number): (typeof USERS)[number] => {
  const user = USERS[index];
  if (user === undefined) throw new Error(`No seed user at index ${index}`);
  return user;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const dateOnly = (date: Date): string => date.toISOString().slice(0, 10);
const daysAgo = (days: number): Date => new Date(Date.now() - days * DAY_MS);

// Each bike's hero photo is a local file at client/public/bike-photos/<slug>.jpg,
// where <slug> is the bike name lower-cased with non-alphanumerics hyphenated.
// Drop the real photo in with that name and it appears; otherwise the gallery
// shows its placeholder. See client/public/bike-photos/README.md.
const photoSlug = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const heroImageUrl = (name: string): string => `/bike-photos/${photoSlug(name)}.jpg`;

interface SeedBike {
  id: string;
  owner: number; // index into USERS
  name: string;
  brand: string;
  model: string;
  year: number;
  type: BikeType;
  is_public: boolean;
  lifetimeKm: number; // realistic lifetime odometer; drives mileage everywhere
  description: string;
}

// Real, popular production bikes spread across the ten seed users (mix of
// public and private). lifetimeKm is a believable odometer for the bike's age
// and use; component and maintenance mileage are derived from it so every
// number is internally consistent. Each bike's hero_image_url is wired to a
// local file under client/public/bike-photos/ (see that folder's README); the
// gallery falls back to a placeholder when the file is not present.
const BIKES: SeedBike[] = [
  { id: 'b1ce0001-0000-4000-8000-000000000000', owner: 0, name: 'Tarmac SL7', brand: 'Specialized', model: 'Tarmac SL7 Expert', year: 2021, type: 'road', is_public: true, lifetimeKm: 22000, description: 'Race-day road bike. Light, stiff, and quietly intimidating.' },
  { id: 'b1ce0002-0000-4000-8000-000000000000', owner: 0, name: 'Diverge', brand: 'Specialized', model: 'Diverge Comp', year: 2021, type: 'gravel', is_public: true, lifetimeKm: 14000, description: 'Gravel and winter bike. Takes 45 mm tires and full fenders.' },
  { id: 'b1ce0003-0000-4000-8000-000000000000', owner: 1, name: 'CAAD13', brand: 'Cannondale', model: 'CAAD13 105', year: 2019, type: 'road', is_public: false, lifetimeKm: 26000, description: 'The aluminium bike that rides like carbon. Summer road bike.' },
  { id: 'b1ce0004-0000-4000-8000-000000000000', owner: 1, name: 'Fuel EX', brand: 'Trek', model: 'Fuel EX 8', year: 2020, type: 'mtb', is_public: true, lifetimeKm: 9000, description: 'Trail full-suspension. Does everything well enough.' },
  { id: 'b1ce0005-0000-4000-8000-000000000000', owner: 1, name: 'FX 3', brand: 'Trek', model: 'FX 3 Disc', year: 2018, type: 'urban', is_public: false, lifetimeKm: 31000, description: 'Beater commuter. Rack, fenders, lights, no shame.' },
  { id: 'b1ce0006-0000-4000-8000-000000000000', owner: 2, name: 'Caledonia', brand: 'Cervélo', model: 'Caledonia 5', year: 2022, type: 'road', is_public: true, lifetimeKm: 30000, description: 'Endurance race bike for the long events that matter.' },
  { id: 'b1ce0007-0000-4000-8000-000000000000', owner: 2, name: 'Roubaix', brand: 'Specialized', model: 'Roubaix Sport', year: 2020, type: 'road', is_public: false, lifetimeKm: 38000, description: 'The ultra bike. Future Shock and a saddle I trust at hour twelve.' },
  { id: 'b1ce0008-0000-4000-8000-000000000000', owner: 3, name: 'Bad Boy', brand: 'Cannondale', model: 'Bad Boy 3', year: 2018, type: 'urban', is_public: true, lifetimeKm: 33000, description: 'Lefty fork, blacked out, does the commute every day.' },
  { id: 'b1ce0009-0000-4000-8000-000000000000', owner: 3, name: 'Ultimate CF SL', brand: 'Canyon', model: 'Ultimate CF SL 7', year: 2016, type: 'road', is_public: false, lifetimeKm: 24000, description: 'Lightweight climbing bike for the weekend hills.' },
  { id: 'b1ce000a-0000-4000-8000-000000000000', owner: 4, name: 'Hightower', brand: 'Santa Cruz', model: 'Hightower C', year: 2023, type: 'mtb', is_public: true, lifetimeKm: 5500, description: 'Full-suspension enduro bike. The fun one.' },
  { id: 'b1ce000b-0000-4000-8000-000000000000', owner: 4, name: 'Marlin', brand: 'Trek', model: 'Marlin 7', year: 2018, type: 'mtb', is_public: false, lifetimeKm: 9000, description: 'Hardtail for skills practice and winter.' },
  { id: 'b1ce000c-0000-4000-8000-000000000000', owner: 5, name: 'Sirrus', brand: 'Specialized', model: 'Sirrus X 4.0', year: 2021, type: 'urban', is_public: true, lifetimeKm: 24000, description: 'Flat-bar commuter. Full fenders, dynamo lights, wet-ready.' },
  { id: 'b1ce000d-0000-4000-8000-000000000000', owner: 5, name: 'Domane', brand: 'Trek', model: 'Domane SL 5', year: 2019, type: 'road', is_public: false, lifetimeKm: 12000, description: 'The nice bike, only comes out when it is dry.' },
  { id: 'b1ce000e-0000-4000-8000-000000000000', owner: 6, name: 'Trek 520', brand: 'Trek', model: '520', year: 2020, type: 'touring', is_public: true, lifetimeKm: 28000, description: 'Steel touring classic. Randonnees and a dynamo light.' },
  { id: 'b1ce000f-0000-4000-8000-000000000000', owner: 6, name: 'Warbird', brand: 'Salsa', model: 'Warbird C', year: 2019, type: 'gravel', is_public: false, lifetimeKm: 16000, description: 'Winter trainer with mudguards and studded tires.' },
  { id: 'b1ce0010-0000-4000-8000-000000000000', owner: 7, name: '6061 Track', brand: 'State Bicycle Co.', model: '6061 Black Label', year: 2021, type: 'other', is_public: true, lifetimeKm: 15000, description: 'Fixed-gear track bike, also my city bike.' },
  { id: 'b1ce0011-0000-4000-8000-000000000000', owner: 7, name: 'Allez', brand: 'Specialized', model: 'Allez Sport', year: 2019, type: 'road', is_public: false, lifetimeKm: 13000, description: 'Geared road bike for the days with hills.' },
  { id: 'b1ce0012-0000-4000-8000-000000000000', owner: 8, name: 'Spectral', brand: 'Canyon', model: 'Spectral 29', year: 2023, type: 'mtb', is_public: true, lifetimeKm: 5000, description: '150 mm of travel for the Wicklow descents.' },
  { id: 'b1ce0013-0000-4000-8000-000000000000', owner: 8, name: 'Stumpjumper', brand: 'Specialized', model: 'Stumpjumper Comp', year: 2021, type: 'mtb', is_public: false, lifetimeKm: 9500, description: 'The everyday trail bike, quick and predictable.' },
  { id: 'b1ce0014-0000-4000-8000-000000000000', owner: 8, name: 'Chameleon', brand: 'Santa Cruz', model: 'Chameleon', year: 2018, type: 'mtb', is_public: false, lifetimeKm: 11000, description: 'Steel hardtail. Keeps me honest about line choice.' },
  { id: 'b1ce0015-0000-4000-8000-000000000000', owner: 9, name: 'Long Haul Trucker', brand: 'Surly', model: 'Long Haul Trucker', year: 2020, type: 'touring', is_public: true, lifetimeKm: 26000, description: 'Loaded touring bike. Has carried me across three countries.' },
  { id: 'b1ce0016-0000-4000-8000-000000000000', owner: 9, name: 'Grizl', brand: 'Canyon', model: 'Grizl 7', year: 2019, type: 'gravel', is_public: false, lifetimeKm: 18000, description: 'Drop-bar gravel bike for unloaded day rides.' },
];

interface ComponentSpec {
  category: ComponentCategory;
  name: string;
  brand?: string;
  model?: string;
}

const GROUPSETS: Record<BikeType, readonly string[]> = {
  road: ['Shimano 105 R7000', 'Shimano Ultegra R8000', 'SRAM Rival eTap AXS'],
  gravel: ['Shimano GRX 810', 'SRAM Apex XPLR', 'Shimano GRX 600'],
  mtb: ['Shimano Deore XT M8100', 'SRAM GX Eagle', 'Shimano SLX M7100'],
  urban: ['Shimano Deore M6000', 'Shimano Alivio', 'Sturmey-Archer 3-speed'],
  touring: ['Shimano Deore XT', 'Shimano GRX 600', 'microSHIFT Advent X'],
  other: ['Single-speed', 'Fixed cog', 'Shimano 105'],
};
const TIRES: Record<BikeType, readonly string[]> = {
  road: ['Continental GP5000 28', 'Pirelli P Zero 28', 'Vittoria Corsa 30'],
  gravel: ['WTB Riddler 700x42', 'Panaracer GravelKing 43', 'Maxxis Rambler 40'],
  mtb: ['Maxxis Minion DHF 2.5', 'Schwalbe Magic Mary 2.4', 'Maxxis Dissector 2.4'],
  urban: ['Schwalbe Marathon Plus 35', 'Continental Contact 37', 'Panaracer Pasela 32'],
  touring: ['Schwalbe Marathon Mondial 40', 'Continental Contact Travel 42'],
  other: ['Continental Gatorskin 25', 'Vittoria Rubino 28'],
};
const WHEELS: Record<BikeType, readonly string[]> = {
  road: ['DT Swiss PR 1400', 'Fulcrum Racing 5', 'Zipp 303 S'],
  gravel: ['DT Swiss G 1800', 'Hunt 4 Season Gravel', 'Fulcrum Rapid Red'],
  mtb: ['DT Swiss XM 1700', 'Stan’s Flow MK4', 'Race Face Turbine'],
  urban: ['Mavic Aksium', 'Shimano RS010', 'hand-built 32h'],
  touring: ['Ryde Andra 40 36h', 'DT Swiss 545d', 'hand-built touring 36h'],
  other: ['H Plus Son Archetype', 'Mavic Open Pro'],
};

// Build a realistic component set for a bike. The frame carries the bike's own
// brand and model; the wear items are picked from per-category pools.
function componentsFor(bike: SeedBike): ComponentSpec[] {
  const key = bike.type;
  const set: ComponentSpec[] = [
    { category: 'frame', name: `${bike.brand} ${bike.model} frame`, brand: bike.brand, model: bike.model },
    { category: 'groupset', name: pick(GROUPSETS[key]), brand: 'Shimano' },
    { category: 'wheels', name: pick(WHEELS[key]) },
    { category: 'tires', name: pick(TIRES[key]) },
    { category: 'chain', name: 'Shimano HG chain' },
    { category: 'cassette', name: pick(['11-28T', '11-34T', '10-51T', '11-40T']) },
    { category: 'saddle', name: pick(['Fizik Antares', 'Specialized Power', 'Brooks B17', 'SDG Bel-Air']) },
  ];
  if (key === 'mtb') {
    set.push({ category: 'seatpost', name: pick(['OneUp V2 dropper', 'BikeYoke Revive dropper']) });
    set.push({ category: 'brakes', name: pick(['Shimano XT 4-piston', 'SRAM Code R']) });
  } else {
    set.push({ category: 'brakes', name: pick(['Shimano 105 hydraulic', 'SRAM Rival hydraulic', 'rim brakes']) });
  }
  if (key === 'urban' || key === 'touring') {
    set.push({ category: 'fenders', name: 'SKS Bluemels full fenders' });
    set.push({ category: 'rack', name: 'Tubus Cargo rear rack' });
    set.push({ category: 'lights', name: 'dynamo front and rear' });
  }
  return set;
}

// Maintenance templates. Some target a specific component category.
const MAINTENANCE_TEMPLATES: ReadonlyArray<{
  type: MaintenanceType;
  title: string;
  category?: ComponentCategory;
}> = [
  { type: 'service', title: 'Full drivetrain clean and lube' },
  { type: 'repair', title: 'Replaced worn chain', category: 'chain' },
  { type: 'repair', title: 'New tires fitted', category: 'tires' },
  { type: 'service', title: 'Brake bleed and pad replacement', category: 'brakes' },
  { type: 'upgrade', title: 'Upgraded wheelset', category: 'wheels' },
  { type: 'inspection', title: 'Pre-season safety check' },
  { type: 'service', title: 'Bottom bracket service' },
  { type: 'repair', title: 'New cassette and chain', category: 'cassette' },
  { type: 'service', title: 'Gear indexing and cable replacement' },
  { type: 'repair', title: 'Tubeless top-up and plug' },
];

const RIDE_NOTES: readonly string[] = [
  '',
  '',
  '',
  'Easy recovery spin.',
  'Felt strong, negative split.',
  'Headwind the whole way home.',
  'Coffee stop halfway, no regrets.',
  'Wet roads, took the descents carefully.',
  'New segment PR on the climb.',
  'Long endurance day, kept it steady.',
  'Commute, nothing exciting.',
  'First ride on the new tires, big improvement.',
];

async function seed(): Promise<void> {
  console.log('Seeding users...');
  for (const user of USERS) {
    await db
      .insertInto('users')
      .values({
        id: user.id,
        google_id: user.google_id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
      })
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
        }),
      )
      .execute();
  }

  console.log('Seeding tags...');
  for (const tag of TAGS) {
    await db
      .insertInto('tags')
      .values({ name: tag.name, slug: tag.slug })
      .onConflict((oc) => oc.column('slug').doNothing())
      .execute();
  }

  const tagRows = await db.selectFrom('tags').selectAll().execute();
  const tagBySlug = new Map(tagRows.map((t) => [t.slug, t.id]));

  console.log('Seeding posts...');
  for (const post of POSTS) {
    const published_at = new Date(
      Date.now() - post.published_days_ago * 24 * 60 * 60 * 1000,
    );
    const created_at_offset = 2; // posts created 2 days before publish
    const created_at = new Date(
      published_at.getTime() - created_at_offset * 24 * 60 * 60 * 1000,
    );

    const existing = await db
      .selectFrom('posts')
      .select('id')
      .where('slug', '=', post.slug)
      .executeTakeFirst();

    if (existing) {
      // Keep seed-owned posts in sync with the seed source so re-seeding
      // refreshes their content (e.g. the de-em-dashed bodies), not just the
      // cover image.
      await db
        .updateTable('posts')
        .set({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          cover_image_url: post.cover_image_url,
          category: post.category,
        })
        .where('id', '=', existing.id)
        .execute();
      console.log(`  - ${post.slug} exists, refreshed content`);
      continue;
    }

    const inserted = await db
      .insertInto('posts')
      .values({
        author_id: post.author_id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        cover_image_url: post.cover_image_url,
        category: post.category,
        status: 'published',
        published_at,
        created_at: created_at.toISOString(),
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    for (const slug of post.tag_slugs) {
      const tag_id = tagBySlug.get(slug);
      if (tag_id !== undefined) {
        await db
          .insertInto('post_tags')
          .values({ post_id: inserted.id, tag_id })
          .onConflict((oc) => oc.doNothing())
          .execute();
      }
    }
    console.log(`  + ${post.slug}`);
  }

  console.log('Seeding likes and comments...');
  const allPosts = await db.selectFrom('posts').select(['id', 'slug']).execute();
  for (const post of allPosts) {
    // Each seed user likes each post (deterministic, idempotent)
    for (const user of USERS) {
      await db
        .insertInto('likes')
        .values({ user_id: user.id, post_id: post.id })
        .onConflict((oc) => oc.doNothing())
        .execute();
    }
  }

  // A few seed comments so threads are visible
  const firstPost = allPosts[0];
  if (firstPost) {
    const existingComments = await db
      .selectFrom('comments')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('post_id', '=', firstPost.id)
      .executeTakeFirstOrThrow();

    if (existingComments.count === '0') {
      await db
        .insertInto('comments')
        .values([
          {
            post_id: firstPost.id,
            user_id: USERS[1].id,
            content: 'Great write-up. Curious what pressure you ran on the road sections. I find 2.3 bar on 42 mm a bit squirmy on smooth tarmac.',
          },
          {
            post_id: firstPost.id,
            user_id: USERS[4].id,
            content: 'The mud point is important. I ran a similar tire in the Vosges last winter and bailed on the wet singletrack after two corners.',
          },
        ])
        .execute();
    }
  }

  console.log('Seeding bikes...');
  // Refresh the seed-owned bikes so re-runs pick up edits to the roster and its
  // mileage. Deleting a bike cascades to its components, maintenance logs, and
  // rides (ON DELETE CASCADE). Scoped strictly to seed bike ids, so real
  // Google-auth users' bikes are never touched.
  await db
    .deleteFrom('bikes')
    .where('id', 'in', BIKES.map((bike) => bike.id))
    .execute();
  for (const bike of BIKES) {
    await db
      .insertInto('bikes')
      .values({
        id: bike.id,
        user_id: userAt(bike.owner).id,
        name: bike.name,
        brand: bike.brand,
        model: bike.model,
        year: bike.year,
        type: bike.type,
        description: bike.description,
        hero_image_url: heroImageUrl(bike.name),
        is_public: bike.is_public,
        total_mileage_km: bike.lifetimeKm,
      })
      .execute();
  }

  console.log('Seeding components...');
  // Regularly-replaced wear parts vs. parts that live with the bike.
  const wearCategories = new Set<ComponentCategory>([
    'chain',
    'tires',
    'cassette',
    'bar_tape',
  ]);
  for (const bike of BIKES) {
    const hasComponents = await db
      .selectFrom('bike_components')
      .select('id')
      .where('bike_id', '=', bike.id)
      .executeTakeFirst();
    if (hasComponents) continue;

    for (const component of componentsFor(bike)) {
      const isWearItem = wearCategories.has(component.category);
      // mileage_at_install is the bike's odometer when the component was fitted.
      // Original parts went on near 0 km; wear parts were fitted recently, so
      // their install odometer sits just below the current lifetime total. The
      // list derives the distance ridden as (bike total - this value), so
      // original parts show ~the full odometer and wear parts only recent km.
      const recentKm = Math.min(bike.lifetimeKm, randInt(150, 3500));
      const mileageAtInstall = isWearItem
        ? bike.lifetimeKm - recentKm
        : randInt(0, Math.round(bike.lifetimeKm * 0.02));
      await db
        .insertInto('bike_components')
        .values({
          bike_id: bike.id,
          category: component.category,
          name: component.name,
          brand: component.brand ?? null,
          model: component.model ?? null,
          installed_at: isWearItem
            ? dateOnly(daysAgo(randInt(20, 400)))
            : `${bike.year}-03-15`,
          mileage_at_install: mileageAtInstall,
        })
        .execute();
    }
  }

  console.log('Seeding maintenance logs...');
  for (const bike of BIKES) {
    const hasLogs = await db
      .selectFrom('maintenance_logs')
      .select('id')
      .where('bike_id', '=', bike.id)
      .executeTakeFirst();
    if (hasLogs) continue;

    const components = await db
      .selectFrom('bike_components')
      .select(['id', 'category'])
      .where('bike_id', '=', bike.id)
      .execute();
    const componentByCategory = new Map(
      components.map((component) => [component.category, component.id]),
    );

    const ownedDays = Math.max(365, (2026 - bike.year) * 365);
    const logCount = randInt(3, 6);
    for (let index = 0; index < logCount; index++) {
      const template = pick(MAINTENANCE_TEMPLATES);
      // Logs advance in mileage and date together: the oldest sits low on the
      // odometer and far back in time, the newest near the current lifetime
      // mileage and recent, so km-since-last-service stays realistic.
      const fraction = (index + 1) / (logCount + 1);
      const mileageAtService = Math.round(bike.lifetimeKm * fraction);
      const daysAgoValue = Math.round(ownedDays * (1 - fraction)) + randInt(0, 25);
      await db
        .insertInto('maintenance_logs')
        .values({
          bike_id: bike.id,
          component_id: template.category
            ? componentByCategory.get(template.category) ?? null
            : null,
          type: template.type,
          title: template.title,
          description: chance(0.5) ? 'Routine work, no issues found.' : null,
          cost: chance(0.7) ? randInt(15, 320) : null,
          mileage_at_service: mileageAtService,
          performed_at: dateOnly(daysAgo(daysAgoValue)),
        })
        .execute();
    }
  }

  console.log('Seeding rides...');
  for (const [userIndex, user] of USERS.entries()) {
    const userId = user.id;
    const hasRides = await db
      .selectFrom('rides')
      .select('id')
      .where('user_id', '=', userId)
      .executeTakeFirst();
    if (hasRides) continue;

    const ownedBikes = BIKES.filter((bike) => bike.owner === userIndex);
    if (ownedBikes.length === 0) continue;

    const rideCount = randInt(12, 26);
    for (let index = 0; index < rideCount; index++) {
      const bike = pick(ownedBikes);
      const distanceKm = randInt(120, 1600) / 10; // 12.0 to 160.0 km
      const durationMin = Math.round(distanceKm * (randInt(20, 32) / 10));
      const note = pick(RIDE_NOTES);
      await db
        .insertInto('rides')
        .values({
          user_id: userId,
          bike_id: bike.id,
          distance_km: distanceKm,
          duration_min: durationMin,
          date: dateOnly(daysAgo(randInt(0, 360))),
          notes: note === '' ? null : note,
        })
        .execute();
    }
  }

  // total_mileage_km is the bike's lifetime odometer, set from lifetimeKm when
  // the bike is inserted. The seeded rides are a recent sample for the feed and
  // activity stats, not the full history, so they do not redefine the total.

  console.log('Seeding follows...');
  const followPairs: ReadonlyArray<readonly [number, number]> = [
    [0, 1], [0, 2], [0, 3], [1, 0], [1, 4], [1, 2], [2, 0], [2, 6], [2, 1],
    [3, 0], [3, 5], [3, 6], [4, 1], [4, 8], [5, 0], [5, 6], [6, 2], [6, 9],
    [6, 3], [7, 0], [7, 1], [8, 4], [8, 1], [9, 6], [9, 0],
  ];
  for (const [follower, following] of followPairs) {
    if (follower === following) continue;
    await db
      .insertInto('follows')
      .values({
        follower_id: userAt(follower).id,
        following_id: userAt(following).id,
      })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  console.log('Seeding bookmarks...');
  const bookmarkPosts = await db.selectFrom('posts').select('id').execute();
  for (const user of USERS) {
    // Guard per user so re-runs do not keep adding pairs (the deterministic RNG
    // state diverges once the earlier bulk sections are skipped).
    const hasBookmarks = await db
      .selectFrom('bookmarks')
      .select('user_id')
      .where('user_id', '=', user.id)
      .executeTakeFirst();
    if (hasBookmarks) continue;
    for (const post of bookmarkPosts) {
      if (chance(0.25)) {
        await db
          .insertInto('bookmarks')
          .values({ user_id: user.id, post_id: post.id })
          .onConflict((oc) => oc.doNothing())
          .execute();
      }
    }
  }

  console.log('Seeding threaded comments...');
  const topLevelComments = [
    'This is exactly what I needed, thanks for writing it up.',
    'Solid advice. I learned this the hard way last season.',
    'Curious how this holds up in the wet, but the dry-road logic is sound.',
    'Saved for my next service. The step-by-step makes it approachable.',
    'I disagree slightly on the pressure, but the rest matches my experience.',
    'Great detail here, especially the part about preparation.',
  ];
  const replyComments = [
    'Good point, I had not thought of it that way.',
    'Same here, it took me a few tries to get it right.',
    'Agreed, that detail makes all the difference.',
    'Fair, it probably depends on the conditions you ride in.',
  ];
  const recentPosts = await db
    .selectFrom('posts')
    .select('id')
    .orderBy('published_at', 'desc')
    .limit(14)
    .execute();
  for (const post of recentPosts) {
    const hasComments = await db
      .selectFrom('comments')
      .select('id')
      .where('post_id', '=', post.id)
      .executeTakeFirst();
    if (hasComments) continue;

    const parent = await db
      .insertInto('comments')
      .values({
        post_id: post.id,
        user_id: pick(USERS).id,
        content: pick(topLevelComments),
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    if (chance(0.7)) {
      await db
        .insertInto('comments')
        .values({
          post_id: post.id,
          user_id: pick(USERS).id,
          parent_id: parent.id,
          content: pick(replyComments),
        })
        .execute();
    }
    if (chance(0.5)) {
      await db
        .insertInto('comments')
        .values({
          post_id: post.id,
          user_id: pick(USERS).id,
          content: pick(topLevelComments),
        })
        .execute();
    }
  }

  await sql`ANALYZE`.execute(db);
  console.log('Seed complete.');
}

seed()
  .then(() => db.destroy())
  .catch((err: unknown) => {
    console.error('Seed failed:', err);
    void db.destroy();
    process.exit(1);
  });
