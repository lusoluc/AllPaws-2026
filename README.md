# AllPaws-2026 🐾

Welcome to **AllPaws-2026**, a warm, volunteer-driven, mobile-first web framework designed to simplify animal rescue, shelter management, and adoption coordination. 

This framework was built from the ground up to help animal shelters save precious administrative time—time that goes directly back to caring for the animals.

---

## 📢 Open Source & Community Disclaimer

> [!WARNING]
> **Open Source Software - No Warranty**
>
> AllPaws-2026 is provided **"as is"**, without warranty of any kind, express or implied. The author and contributors make no guarantees regarding the accuracy, completeness, or reliability of the code, nor do they assume liability for any bugs, errors, sync issues, data loss, or server interruptions. 
>
> Downstream shelters and developers are responsible for testing, securing, and maintaining their own instances and cloud environments. We strongly encourage deploying to a staging/testing database before utilizing it in active production.

---

## 🌟 What is AllPaws-2026?

AllPaws-2026 is not a cold, corporate SaaS dashboard. It is a **living-room style digital companion** for shelter volunteers. It acts as an offline-first capture tool on mobile devices so that helpers can record rescues, capture photos, and write notes even in remote areas without signal. 

Additionally, it functions as a **complete web presence for the shelter**, providing:
*   🌐 **Native Multi-Language Support (DE/LT)**: Switch the entire user interface and user-generated database contents between German and Lithuanian instantly.
*   🐈 **Automated Public Animal Gallery**: A live catalog of adoptable animals generated dynamically from database records.
*   ✍️ **Voluntary CMS & FAQ Engine**: Easily create general web pages (like shelter history, bank account details) and maintain a public FAQ section without writing any code.
*   💳 **Integrated Donations & Cost Transparency**: Display customizable bank transfer details and PayPal donation buttons alongside an emotional cost breakdown table to show supporters exactly how their contributions help.

For complete, friendly guides on our vision, features, and examples, please explore our documentation:

*   📖 **[North Star & Vision Document](file:///c:/Users/Admin/Documents/AllPaws-2026/docs/NORTH_STAR.md)** - The "Why" behind this framework and our mission to save lives.
*   🐾 **[High-Level Feature Overview](file:///c:/Users/Admin/Documents/AllPaws-2026/docs/FEATURE_OVERVIEW.md)** - A quick list of what the framework can do out-of-the-box.
*   💡 **[Detailed Features & Real-Life Examples](file:///c:/Users/Admin/Documents/AllPaws-2026/docs/DETAILED_FEATURES.md)** - In-depth guide filled with everyday shelter scenarios for non-technical users, plus details on our testing framework.

---

## 🧪 Built-In Test Suites

To ensure reliability for every shelter that forks this repository, AllPaws-2026 comes with a comprehensive testing suite running on Jest. The test suites validate everything from IndexedDB offline storage to email newsletters and UI translation switches.

Currently, the framework includes **12 test suites** validating **84 unique test scenarios**:
*   `sync.test.tsx` - Tests background cloud sync queues and conflict resolution.
*   `share.test.tsx` - Validates the dynamic canvas card generation and sharing strings.
*   `login.test.tsx` - Validates the secure client-side password flow and developer mode.
*   `public.test.tsx` - Tests the home page, bilingual translation switches, and CMS blocks.
*   `PublicHeader.test.tsx` - Tests navigation tabs highlighting, language toggle callback, mobile drawer menu, and real-time database sync status badge.
*   `gallery.test.tsx` - Tests search, filters, and animal cards rendering.
*   `edit.test.tsx` & `create.test.tsx` - Tests draft saving, OPFS media storage, and validation.

### Running the Tests
To run all tests locally, use `pnpm` (which handles our package workspaces):
```bash
# Run the test suites
pnpm test
```
If you encounter permission issues running pnpm scripts on Windows PowerShell, run via cmd:
```cmd
cmd /c pnpm test
```

---

## 🛠️ Quick Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/lusoluc/AllPaws-2026.git
    cd AllPaws-2026
    ```
2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
3.  **Configure Environment**:
    Create a `.env.local` file at the root and fill in your Supabase connection and dashboard passwords (see [`.env.local`](file:///c:/Users/Admin/Documents/AllPaws-2026/.env.local) for templates).
4.  **Run Development Server**:
    ```bash
    pnpm dev
    ```

---

## ❤️ Credits
Developed as a voluntary labor of love by **Carlos Lucas** (Germany).
*   **LinkedIn**: [Carlos Lucas](https://www.linkedin.com/in/director-it-development/)
