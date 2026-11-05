# StudyMate AI

> **Product tagline:** Learn Smarter. Plan Better. Achieve More.  
> **Project status:** Section 3 Public Landing Page & Frontend Foundation Implemented

StudyMate AI is an AI-powered student learning platform that helps students discover quality learning resources, understand topics, organize study goals, and track progress.

---

## Tech Stack

- **Frontend:** Vue 3 (Composition API with `<script setup lang="ts">`) + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 with custom design tokens
- **Routing:** Vue Router 4
- **State Management:** Pinia
- **Theme System:** Warm cream light theme (`#F7F4EC`) and true black dark theme (`#090909`), zero-flash initialization, Light/Dark/System preferences
- **Icons:** Lucide Icons (`lucide-vue-next`)

---

## Features Implemented (Section 3)

1. **Design System & Theme Switcher:**
   - Strict adherence to the warm cream light theme and black dark theme specified in Section 1.
   - Persistent theme store supporting `light`, `dark`, and `system` preferences.
   - Anti-flash head script in `index.html` preventing theme flash on reload.

2. **Public Landing Page:**
   - **Navbar:** StudyMate AI branding, navigation links (`Home`, `Features`, `How It Works`, `Pricing`), theme toggle dropdown, `Log in` link, and `Get Started` primary CTA. Includes a mobile responsive menu drawer.
   - **Hero Section:** Clear editorial typography with the official tagline, prominent search bar with realistic placeholder (`What do you want to learn today?`), and quick search pills (`Learn Python from scratch`, `Operating System — Deadlocks`, `Machine Learning — Regression`, `Data Structures and Algorithms`).
   - **Interactive Search Preview State:** Clicking the search CTA opens an interactive preview modal displaying how a learning package is organized into Key Takeaways, Verified YouTube Lectures, Documentation & Readings, and an AI Diagnostic Check quiz with answer explanations.
   - **Product Preview Mockup:** An editorial breakdown demonstrating syllabus verification, module runtimes, and daily milestones.
   - **Features Section:** 6 cards with concise explanations and consistent iconography: AI Learning Search, Personalized Study Planner, Notes Summarizer, Progress Tracking, Saved Learning Resources, and AI Quiz Generator.
   - **How It Works Section:** 3-step structured student journey from topic discovery to planning and progress tracking.
   - **Pricing Preview Section:** Proposed Free Starter (`₹0`) and Premium Student Pro (`₹79/month`) tiers with feature comparisons and clear proposed-pricing disclosures.
   - **Final Call to Action (CTA):** Encouraging students to get started with zero credit cards required.
   - **Footer:** Links to products, features, pricing, contact form, privacy policy, and terms of service.

3. **Placeholder & Staging Routes:**
   - `/login` and `/signup`: Styled auth views ready for Section 4 Firebase Authentication.
   - `/dashboard`: Student workspace overview with realistic empty states.
   - `/terms`, `/privacy`, `/contact`, `/faq`, `/guides`, `/safety`: Dedicated views to ensure zero broken links.

---

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
