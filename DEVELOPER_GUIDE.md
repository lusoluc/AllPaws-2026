# AllPaws 2026 — Developer Guide

> *Built with love by volunteers who believe every paw deserves a warm home.* 🐾

Welcome aboard! If you're reading this, you probably care about animals — and that already makes you one of us. This guide will walk you through everything you need to get the AllPaws 2026 app running on your machine, understand how the pieces fit together, and start contributing. No gatekeeping, no hoops to jump through. Just real people building something good.

---

## About the Project

AllPaws 2026 is an **open-source, mobile-first Progressive Web App (PWA)** built for small animal rescue NGOs — the kind of scrappy, underfunded organizations that run on heart and spare change.

The app helps shelters manage animal profiles, handle adoption inquiries, send newsletters, and present their rescued animals to the world — all while working **offline-first**, because stable internet isn't a given in every shelter.

- **Created by**: [Carlos Lucas](https://www.linkedin.com/in/director-it-development/) and a crew of volunteer contributors who pour their free time (and often their own money) into this.
- **Partner shelter**: VšĮ "Būk mano draugas" in Klaipėda, Lithuania — a real shelter doing real rescue work on the ground.
- **License**: [MIT](./LICENSE) — fully open source. Fork it, adapt it, make it yours. Contributions are always welcome.
- **Repository**: [github.com/lusoluc/AllPaws-2026](https://github.com/lusoluc/AllPaws-2026)

Every single line of code, every design decision, every late-night debugging session — it's all privately contributed. 100% goes to helping the animals.

---

## Prerequisites

Before you dive in, make sure you have these on your machine:

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | v18+ | LTS recommended — grab it from [nodejs.org](https://nodejs.org) |
| **pnpm** | Latest | Our preferred package manager (`npm install -g pnpm`) |
| **Git** | Latest | You know the drill |
| **Code editor** | — | VS Code recommended (great TypeScript & Tailwind support) |
| **Supabase account** | — | *Optional* — only needed if you want cloud sync |

> [!TIP]
> If you prefer npm over pnpm, that works too. Just swap `pnpm` for `npm` in the commands below. We lean toward pnpm because it's faster and more disk-friendly.

---

## Getting Started

Ready? Let's get this running. It takes about two minutes:

```bash
# Clone the repo
git clone https://github.com/lusoluc/AllPaws-2026.git
cd AllPaws-2026

# Install dependencies
pnpm install

# Fire it up
pnpm dev
```

Open your browser at **http://localhost:3000** and you should see the homepage.

### Logging In

The dashboard is password-protected (no user accounts — this is intentional for small teams):

| Login | Password | What it unlocks |
|-------|----------|-----------------|
| **Staff** | `BMD2026` | Full dashboard — animal management, newsletters, inquiries |
| **Developer** | `DEVBMD2026` | Everything above + system logs for debugging |

> [!NOTE]
> These are the default passwords for local development. In production, set your own via environment variables (see [Environment Variables](#environment-variables) below).

---

## Project Architecture

Here's the lay of the land — where things live and why:

```
app/                        # Next.js App Router pages
├── page.tsx                # Public homepage (bilingual DE/LT)
├── login/                  # Staff authentication
├── dashboard/              # Authenticated staff area
│   ├── create/             # Animal registration form
│   ├── edit/               # Animal edit form
│   ├── logs/               # System logs (dev mode only)
│   └── newsletter/         # Newsletter management
├── katzen/                 # Public animal gallery
├── katzen-ratgeber/        # Cat care guide & FAQ
└── ueber-uns/              # About us & donations

components/                 # Shared React components
├── CatHeartLogo.tsx        # Brand logo SVG
├── ClientInitializer.tsx   # DB seeding & service worker registration
├── HelpBottomSheet.tsx     # Contextual help overlay
└── SharePanel.tsx          # Animal profile sharing

lib/                        # Core business logic
├── db.ts                   # Dexie.js database schema & seeding
├── syncManager.ts          # Supabase cloud sync engine
├── supabaseClient.ts       # Supabase client configuration
├── opfsStorage.ts          # OPFS for large media (videos)
├── logger.ts               # System event logger
├── helpContent.ts          # Help text content
└── ratgeberData.ts         # Cat care guide data

__tests__/                  # Jest unit tests
public/                     # Static assets & PWA manifest
```

The app uses the **Next.js 15 App Router** pattern — each folder under `app/` maps to a route. Components are shared across pages, and business logic lives in `lib/`.

---

## Tech Stack

No bloated dependencies here — just the tools we actually need:

| Technology | Purpose |
|---|---|
| **Next.js 15** | React framework with App Router |
| **TypeScript** | Type safety across the entire codebase |
| **Tailwind CSS 3** | Utility-first styling — warm, organic aesthetics |
| **Dexie.js 4** | IndexedDB wrapper — our offline-first database |
| **Supabase** | Cloud database & storage sync |
| **OPFS** | Origin Private File System for large media (videos) |
| **Lucide React** | Clean, friendly icon library |
| **Jest + Testing Library** | Unit testing |

---

## Offline-First Architecture

This is the heart of the app's design philosophy. Shelters don't always have reliable internet — sometimes you're registering a new rescue in a field with one bar of signal. The app needs to *just work*, online or off.

### How It Works

**Dexie.js (IndexedDB)** is the primary database. Every piece of data lives locally first. The cloud is a backup and sync layer, not a dependency.

### Sync Flow

Here's what happens under the hood:

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────────┐
│   User Action    │ ──▶  │  Dexie.js    │ ──▶  │   Supabase      │
│ (create/edit)    │      │  (local DB)  │      │   (cloud sync)  │
└─────────────────┘      └──────────────┘      └─────────────────┘
```

1. **User creates or edits an animal profile** → saved immediately to Dexie with `sync_pending: 1`
2. **When the app detects connectivity** → `syncWithCloud()` pushes all pending records to Supabase
3. **Cloud changes are pulled** and merged back into the local Dexie database
4. **Media files** (photos, videos) are uploaded to Supabase Storage; cloud URLs replace local blobs

Large media files — especially videos — use **OPFS (Origin Private File System)** instead of IndexedDB, because IndexedDB has practical size limits in most browsers. OPFS gives us a proper file-system-like API for handling bigger files without choking the browser.

> [!IMPORTANT]
> The app is fully functional without Supabase configured. Offline mode is the default — cloud sync is an enhancement, not a requirement.

---

## Database Schema

All data lives in Dexie.js tables. Here's what we're working with:

| Table | What it stores |
|-------|---------------|
| `shelters` | Organization details (name, address, contact info) |
| `animals` | Animal profiles — medical status, compatibility traits, photos, videos |
| `internalNotes` | Staff-only notes attached to individual animals |
| `inquiries` | Adoption inquiries from the public |
| `systemLogs` | Application event logs (visible in dev mode) |
| `uiTexts` | CMS-editable UI strings (bilingual German/Lithuanian) |
| `guideItems` | Cat care FAQ items for the Ratgeber section |
| `customBlocks` | CMS content blocks for flexible page content |
| `subscribers` | Newsletter subscribers |
| `newsletterCampaigns` | Newsletter campaign records |
| `newsletterQueue` | Staggered email sending queue |

The schema is defined in `lib/db.ts`. The `seedDatabase()` function in the same file populates initial data on first run.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DASHBOARD_PASSWORD=BMD2026
NEXT_PUBLIC_DEV_PASSWORD=DEVBMD2026
```

> [!NOTE]
> Supabase variables are optional for local development. Without them, the app runs in pure offline mode — which is perfectly fine for most development work.

---

## Running Tests

```bash
# Run all tests
pnpm test

# Watch mode — re-runs on file changes
pnpm test -- --watch

# Generate a coverage report
pnpm test -- --coverage
```

Tests use **Jest** with a `jsdom` environment and **React Testing Library** for component testing. Test files live in the `__tests__/` directory.

---

## Newsletter System

The app includes a built-in newsletter system for shelters to keep supporters in the loop:

- **Public signup form** with duplicate email prevention
- **Admin panel** at `/dashboard/newsletter` with subscriber management
- **Campaign composer** — write newsletters and insert animal profiles directly
- **Staggered sending queue** — max 20 emails per 5-minute batch (to respect rate limits)
- **Currently simulated locally** — no SMTP configured yet; the system is designed and ready for real email provider integration (SendGrid, Resend, etc.)

> [!TIP]
> If you want to contribute an email provider integration, that would be an amazing first contribution! Check the `newsletterQueue` table and the existing queue logic as your starting point.

---

## Contributing

We'd love your help. Seriously. Here's the flow:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes** — write code, fix bugs, improve docs
4. **Run tests**: `pnpm test`
5. **Commit** with a clear, descriptive message
6. **Push** and open a **Pull Request**

### A Note on Tone

This project has a soul. When writing user-facing text — button labels, error messages, help text — please keep it **warm, honest, and human**. No corporate speak. No "leverage synergies." Talk like you're explaining something to a friend over coffee.

Read the [project rules (AGENTS.md)](./AGENTS.md) for the full style guide.

---

## Customization for Your Shelter

Running your own rescue? AllPaws is built to be forked and adapted. Here's how to make it yours:

1. **Shelter details** — Update the `seedDatabase()` function in `lib/db.ts` with your organization's name, address, and contact info
2. **Images** — Replace the photos in the `public/` directory with your own shelter's real-life snapshots (authentic > polished, always)
3. **UI text** — Edit bilingual strings via the built-in CMS, or directly in `lib/db.ts` default UI texts
4. **Cloud backend** — Set up your own Supabase project and update the environment variables
5. **Brand colors** — Tweak `tailwind.config.js` to match your shelter's identity (we use warm ambers and greens — feel free to make it your own)

---

## Code Style

A few conventions we follow to keep things consistent:

- **TypeScript strict mode** — catch bugs early, not in production
- **Functional React components** with hooks — no class components
- **Tailwind CSS utility classes** — colocated with components, no separate CSS files
- **Bilingual UI text objects** — German/Lithuanian by default; structured for easy i18n expansion
- **Preserve existing comments** and docstrings — they're there for a reason

---

## License

**MIT License** — free to use, modify, and distribute. Because helping animals shouldn't come with licensing headaches.

---

## Author

**Carlos Lucas** — [LinkedIn](https://www.linkedin.com/in/director-it-development/)

Built from the heart, sustained by volunteers, and dedicated to every animal still waiting for a home.

---

*If you have questions, hit a snag, or just want to say hi — open an issue on GitHub or reach out. We don't bite. (The cats might, but they're working on it.)* 🐱
