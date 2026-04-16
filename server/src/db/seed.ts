import { sql } from 'kysely';
import { db } from './index.js';

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
    avatar_url: 'https://ui-avatars.com/api/?name=Elena+Rossi&background=2F5233&color=fff&size=256',
    bio: 'Gravel-curious roadie from Bologna. Notes on wheels, chains, and the occasional espresso-fuelled mountain day.',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    google_id: 'seed-marko-jensen',
    email: 'marko@seed.bikeconnect.local',
    display_name: 'Marko Jensen',
    avatar_url: 'https://ui-avatars.com/api/?name=Marko+Jensen&background=E07A3C&color=fff&size=256',
    bio: 'Former mechanic, part-time writer. I maintain too many bikes and I have opinions about chain lube.',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    google_id: 'seed-priya-sharma',
    email: 'priya@seed.bikeconnect.local',
    display_name: 'Priya Sharma',
    avatar_url: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=7A8B56&color=fff&size=256',
    bio: 'Ultra-endurance rider and coach. Writing about long days in the saddle and the training that makes them survivable.',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    google_id: 'seed-tom-becker',
    email: 'tom@seed.bikeconnect.local',
    display_name: 'Tom Becker',
    avatar_url: 'https://ui-avatars.com/api/?name=Tom+Becker&background=1F3A22&color=fff&size=256',
    bio: 'Commuter by day, weekend climber. Big fan of unfashionable bikes.',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    google_id: 'seed-anna-novak',
    email: 'anna@seed.bikeconnect.local',
    display_name: 'Anna Novák',
    avatar_url: 'https://ui-avatars.com/api/?name=Anna+Novak&background=C55A32&color=fff&size=256',
    bio: 'Mountain biker and trail builder from the Czech Republic. If it has knobby tires and a dropper, I will ride it.',
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
    cover_image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1600&q=80',
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
        p('Sustained efforts above 35 km/h on smooth pavement — sprinting from a traffic light still feels like the tire is flexing more than it should. If your weekly ride is a Saturday paceline group, these probably feel slow.'),
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
    cover_image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1600&q=80',
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
          'Your chain is black and shiny — too much lube, not enough wiping.',
          'Your chain is dry and clicky — not enough lube, or your lube is not reaching the rollers.',
          'Your cassette cogs have a ring of black sludge at the base of the teeth — this is dirt-lube paste.',
          'You feel sand-like grit when you pinch the chain between your fingers — time to clean, not re-lube.',
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
    cover_image_url: 'https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?w=1600&q=80',
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
          { text: "Giau is not long by Alpine standards — about 10 km from Pocol — but it is ", bold: false },
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
          'Eating early — I took my first gel at 40 minutes. The ride was too hard for "I\'ll eat when I\'m hungry."',
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
    excerpt: "I held out for years. I was wrong — but not for the reasons disc fans usually give.",
    cover_image_url: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=1600&q=80',
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
        p("Tire clearance. Disc frames tend to allow more tire, because the brake is no longer clamped around the rim. My current bike takes 34 mm tires without complaint. That single change — running 32 mm tubeless at 4.5 bar instead of 25 mm at 7 bar — made a bigger difference to my riding than any other upgrade in the last five years."),
        h(2, 'What still annoys me'),
        ul(
          'Rotor rub. Eight months in, I still chase it occasionally.',
          'Bleeding. It is not hard, but it is finicky, and I miss the simplicity of a cable.',
          "Through-axles. They're fine, but they add 30 seconds to every wheel change, which adds up on a weekend of mechanicals.",
        ),
        h(2, 'Verdict'),
        p("I will not go back. Not because discs are universally better, but because for the way I ride — year-round, in weather, on long descents — they solve a real problem I did not fully appreciate I had. If your riding is summer-only on smooth roads, I would not sweat it."),
      ],
    },
  },
  {
    slug: 'replacing-a-chain-step-by-step',
    author_id: USERS[1].id,
    title: 'Replacing a chain: step-by-step, with torque specs',
    excerpt: "It takes 15 minutes and saves you from replacing the whole drivetrain six months later. If you can use a multi-tool, you can do this.",
    cover_image_url: 'https://images.unsplash.com/photo-1593709707280-dcd28ee2f7a8?w=1600&q=80',
    category: 'maintenance_guide',
    published_days_ago: 21,
    tag_slugs: ['maintenance', 'drivetrain'],
    content: {
      type: 'doc',
      content: [
        p("A chain is cheap. A cassette is not. A chainring is not. Replacing a chain at the right time is the cheapest serious maintenance job in cycling, and it is easy to do badly."),
        h(2, 'When to replace'),
        p("Use a chain-wear gauge — they are 10-15 euros and they pay for themselves the first time. Replace at 0.5% wear for 11-speed and faster, 0.75% for 10-speed or slower. By the time your chain skips on the cassette under load, you have already worn the cassette."),
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
          'Check cassette wear by running the chain on the outer cog under light load. If it skips, you need a cassette too — the new chain will not mesh with a worn cassette.',
          'Count the links on the old chain. Write the number down.',
          'Lay the new chain next to the old one. Size the new chain to the same number of full links. Do not eyeball this — count.',
          'Break the new chain to length using your chain tool. Push the pin out most of the way but not all the way through — you will need it if the chain is too short.',
          'Thread the new chain through the derailleur in the correct orientation (most chains have a direction arrow; orient it in the direction of drive rotation on the drive-side).',
          'Join the chain with the quick link. Squeeze the two halves together, then apply tension by pedalling forward — the link clicks into place.',
          'Visually inspect the quick link from both sides. It should sit flush, with no gap at the pins.',
          'Run through all gears twice. Check for skipping under load.',
        ),
        h(2, 'Torque specs'),
        p("A chain itself has no torque spec — it's pressed, not bolted. But if you are replacing a cassette at the same time:"),
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
    cover_image_url: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1600&q=80',
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
          "Rear shifter: started missing shifts at 7,500 km. Not yet fixed — suspected cable fray inside the bar.",
          'Tires: I got through four pairs this year, mostly puncture-driven. Tire choice is on me, not the bike.',
        ),
        h(2, 'Parts that impressed me'),
        ul(
          'Frame: no creaks, no cracks, no worrying flex. Zero complaints.',
          'Brakes: still feel as sharp as day one after a winter of wet riding.',
          'Wheels: trued once, still spinning straight.',
        ),
        quote("I like this bike more now than I did at six months. Most bikes I have owned have gone the other way — they fade as the shine wears off and the quirks grate. This one has grown on me as I have learned its habits."),
        h(2, 'Would I buy another?'),
        p("Yes, with two caveats. First, I would not buy one if I was planning to do my own cable work; it's genuinely more painful than a conventional bike. Second, I would budget for consumables — this is an expensive bike to run, not just to buy. But as a ride-every-day race bike, it has earned its place in my garage."),
      ],
    },
  },
  {
    slug: 'coffee-shop-ride-etiquette',
    author_id: USERS[3].id,
    title: 'Coffee-shop ride etiquette, and other things nobody tells you',
    excerpt: "Showing up for your first Saturday group ride is intimidating. Here is the unwritten rulebook, as plainly as I can put it.",
    cover_image_url: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=1600&q=80',
    category: 'general',
    published_days_ago: 32,
    tag_slugs: ['road'],
    content: {
      type: 'doc',
      content: [
        p("I've been riding with the same Saturday group for four years. When I joined I knew almost nobody, I didn't know the routes, and I certainly didn't know the rules — and there are rules. Nobody tells you them explicitly, because long-time riders have internalised them to the point of forgetting they exist. So here is the unwritten rulebook, written down."),
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
        p("Some people ride home after. Some people wait for the next group. Both are fine. What is not fine is leaving without saying goodbye — rides are social, and so are their endings."),
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
    cover_image_url: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=1600&q=80',
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
        p("This is the hardest part of Ventoux on a normal day — 10 km of relentless 9-10%, in the trees, with no view to distract you. At 34°C in the trees, the air was completely still and the road radiated like an oven. I watched my heart rate climb 15 bpm without going any faster."),
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
      .onConflict((oc) => oc.column('id').doNothing())
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
      console.log(`  - ${post.slug} already exists, skipping`);
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
            content: 'Great write-up. Curious what pressure you ran on the road sections — I find 2.3 bar on 42 mm a bit squirmy on smooth tarmac.',
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
