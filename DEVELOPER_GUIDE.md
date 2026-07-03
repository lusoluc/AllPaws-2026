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

## Tech Stack & Dependencies

No bloated dependencies here — all core dependencies and exact version configurations from `package.json` are listed below:

### Core Framework & Runtimes
*   **Next.js 15.1.12**: React framework with App Router routing configurations.
*   **React 19.0.0 & React-DOM 19.0.0**: Leveraging modern rendering paradigms and client hooks.
*   **TypeScript 5.7.2**: Strict type configurations across database tables, forms, and utils.

### Offline & Local Storage Layer
*   **Dexie.js 4.0.10 & Dexie-React-Hooks 4.4.0**: IndexedDB wrapper serving as the primary local offline database.
*   **Origin Private File System (OPFS)**: High-speed native browser storage for heavy media (videos) via `opfsStorage.ts` to bypass IndexedDB size limits.
*   **Web Audio API (Audio Stitcher)**: Leveraging native browser `AudioContext` and decoders in `lib/audioStitcher.ts` to decode, append, and encode raw 16-bit PCM Mono WAV files.

### Cloud Integration & Service Layer
*   **@supabase/supabase-js 2.108.2**: Cloud sync layer pushing offline changes and handling Supabase Storage media uploads.
*   **Nodemailer 9.0.1 (Types: 8.0.1)**: Staggered server-side newsletter queues.

### Styling & Design System
*   **Tailwind CSS 3.4.16 & Autoprefixer 10.4.20**: Colocated utility styles configured with warm organic tokens.
*   **PostCSS 8.4.49**: CSS compiler pipeline.
*   **Lucide React 0.468.0**: SVG icon component assets.

### Quality Assurance & Testing Framework
*   **Jest 30.4.2 & Jest-Environment-JSdom 30.4.1**: Test runner and browser environment mock engine.
*   **TS-Jest 29.4.11**: TypeScript compiler integration for test runs.
*   **React Testing Library (@testing-library/react 16.3.2)**: DOM-based integration verification tools.
*   **@testing-library/jest-dom 6.9.1 & @testing-library/user-event 14.6.1**: Semantic DOM assertions and user interaction simulation utilities.

---

## Offline-First Architecture & Multi-Audio Sync

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
2. **Multi-Audio Local List**: Up to 10 offline audio blobs are stored locally in the Dexie `animals` table under `local_audios` (with names and OPFS keys).
3. **Audio Appending ("Diktierband")**: When continuing an existing recording, the `audioStitcher.ts` decodes both blobs, joins their raw floats, and encodes a single 16-bit 44.1kHz / 48kHz WAV file.
4. **When the app detects connectivity** → `syncWithCloud()` launches in the background:
   - Media files (photos, passport attachments, and `local_audios` recordings) are uploaded to Supabase Storage.
   - Pushes the local changes. The array of uploaded media URLs is serialized as a JSON string inside the fixed remote database column `audio_draft_url`.
   - Merges central updates back. Incoming JSON arrays in `audio_draft_url` are parsed back into the local `audio_urls` array on pulling (retaining compatibility with single legacy string formats).
5. **Conflict Resolution**: If the same animal profile was edited on two devices simultaneously, the newest change wins (based on the `updated_at` timestamp).

---

## Database Schema

All data lives in Dexie.js tables. Here's what we're working with:

The schema is defined in `lib/db.ts`. The `seedDatabase()` function in the same file populates initial data on first run.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Client-side SHA-256 password hashes (defaults are SHA-256 of BMD2026 and DEVBMD2026)
NEXT_PUBLIC_DASHBOARD_PASSWORD_HASH=465e25744db058cd9ec63f6fe36a6e5c9fc66255dec9de88ef9981b33651bd9d
NEXT_PUBLIC_DEV_PASSWORD_HASH=6a02c4469c9b7c5975f09fb41584283959644f604ed7278c19d1e351277eb399

# Server-only API authentication passwords (used for SMTP / send-email rate-limiting verification)
DASHBOARD_PASSWORD=BMD2026
DEV_PASSWORD=DEVBMD2026

# Feature Toggles (Set to 'false' to disable, defaults are 'true')
NEXT_PUBLIC_FEATURE_GALLERY=true
NEXT_PUBLIC_FEATURE_GUIDE=true
NEXT_PUBLIC_FEATURE_EMERGENCY_PAGE=true
NEXT_PUBLIC_FEATURE_ABOUT_US=true
NEXT_PUBLIC_FEATURE_NEWSLETTER=true
NEXT_PUBLIC_FEATURE_INTERACTIVE_INQUIRIES=true
NEXT_PUBLIC_FEATURE_SPONSORSHIP=true
```

### Feature Customization Toggles

Downstream organizations can selectively disable parts of the app via environment variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FEATURE_GALLERY` | Toggles the public animal gallery page (`/tiere`) and links. |
| `NEXT_PUBLIC_FEATURE_GUIDE` | Toggles the public guide/FAQ page (`/ratgeber`) and links. |
| `NEXT_PUBLIC_FEATURE_EMERGENCY_PAGE` | Toggles the public emergency page (`/notfall`) and header warnings. |
| `NEXT_PUBLIC_FEATURE_ABOUT_US` | Toggles the public association/About Us page (`/ueber-uns`) and link. |
| `NEXT_PUBLIC_FEATURE_NEWSLETTER` | Toggles the newsletter signup block on the home page and newsletter dashboard. |
| `NEXT_PUBLIC_FEATURE_INTERACTIVE_INQUIRIES` | Toggles the interactive self-disclosure form (if false, falls back to direct email client) and hidden inquiries manager tab. |
| `NEXT_PUBLIC_FEATURE_SPONSORSHIP` | Toggles display of bank account information and wiring instructions for sponsoring animals. |

> [!NOTE]
> Supabase variables are optional for local development. Without them, the app runs in pure offline mode — which is perfectly fine for most development work. Defaults for hashes and server-side passwords are pre-baked into the app for local developer convenience. All feature toggles default to `true` if not defined.

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
