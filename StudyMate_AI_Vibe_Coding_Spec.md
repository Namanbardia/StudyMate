# StudyMate AI --- Product & Vibe-Coding Master Specification

> **Product tagline:** Learn Smarter. Plan Better. Achieve More.\
> **Project status:** MVP planning / implementation\
> **Primary goal:** Build an AI-powered learning platform that helps
> students discover quality learning resources, understand topics,
> organize study goals, and track progress.

------------------------------------------------------------------------

## How to use this document

This document is designed to be fed to a vibe-coding tool **one section
at a time**.

Recommended workflow:

1.  Give the tool **Section 1 --- Global Instructions** first.
2.  Then give it one implementation phase at a time, in order.
3.  Ask it to inspect the existing code before making changes.
4.  Tell it not to rewrite working modules unless required.
5.  After each phase, run the app, test the result, and commit the
    changes.
6.  Keep this document as the source of truth for product decisions.

**Important:** Do not ask the coding tool to build the entire product in
one prompt. Build incrementally.

------------------------------------------------------------------------

# Section 1 --- Global Instructions for the AI Coding Tool

Copy this section into the coding tool at the beginning of the project.

## Project identity

You are helping build **StudyMate AI**, a modern AI-powered student
learning platform.

Students should be able to search for any topic and receive a
well-organized learning package containing explanations, YouTube videos,
articles, documentation, notes, and other useful resources.

The platform should also help students create study plans, set learning
targets, summarize notes, generate quizzes, and track their learning
progress.

## Product principles

-   Build a polished, production-minded application, not a disposable
    demo.
-   Prioritize a clean, intuitive, student-friendly user experience.
-   Use reusable components and modular code.
-   Make the application responsive on mobile, tablet, and desktop.
-   Use accessible labels, keyboard-friendly controls, and clear
    loading/error/empty states.
-   Do not create fake integrations or pretend that an API is connected
    when it is not.
-   Do not hardcode secrets, API keys, credentials, or private tokens in
    frontend code.
-   Do not invent resource URLs. Display real URLs returned by
    integrations.
-   Keep free-tier usage and operating costs in mind.
-   Explain any new dependency and avoid unnecessary packages.
-   Before editing, inspect the existing project structure and preserve
    working code.
-   Do not replace real backend functionality with mock data without
    clearly marking it as temporary.
-   If credentials or API keys are unavailable, implement a clearly
    isolated integration layer with setup instructions and a safe
    development placeholder.

## Visual direction and color theme

The visual identity must use a **warm light cream theme** and a **true
black / near-black dark theme**.

Do not use the usual blue-purple AI SaaS gradient aesthetic. The
interface should feel calm, premium, editorial, focused, and academic.

### Light theme

-   Main page background: warm cream / off-white.
-   Cards and surfaces: white or slightly lighter cream.
-   Primary text: near-black.
-   Secondary text: warm grey.
-   Borders: subtle beige / warm grey.
-   Primary buttons: black background with cream/white text.
-   Accent: restrained warm amber, muted olive, or another subtle earthy
    accent. Do not overuse it.

Suggested starting design tokens (adjust carefully for contrast and
consistency):

``` css
:root {
  color-scheme: light;
  --color-background: #F7F4EC;
  --color-surface: #FFFEFA;
  --color-surface-muted: #EFEAE0;
  --color-text: #171715;
  --color-text-muted: #77736B;
  --color-border: #E4DED2;
  --color-primary: #171715;
  --color-primary-foreground: #FFFDF7;
  --color-accent: #A58A55;
  --color-success: #52745B;
  --color-danger: #B4534B;
}
```

### Dark theme

-   Main background: black / near-black.
-   Cards: charcoal / very dark grey.
-   Primary text: warm white.
-   Secondary text: muted grey.
-   Borders: subtle charcoal grey.
-   Primary buttons: cream/white background with black text.
-   Keep the same restrained earthy accent.

Suggested starting tokens:

``` css
.dark {
  color-scheme: dark;
  --color-background: #090909;
  --color-surface: #141414;
  --color-surface-muted: #1D1D1B;
  --color-text: #F4F1E9;
  --color-text-muted: #A19D94;
  --color-border: #2B2A27;
  --color-primary: #F4F1E9;
  --color-primary-foreground: #111110;
  --color-accent: #C0A36A;
  --color-success: #85A98A;
  --color-danger: #E08076;
}
```

### Theme behavior

-   Add a theme toggle in the public navbar and authenticated dashboard.
-   Support Light, Dark, and optionally System preference.
-   Persist the user's selected theme locally.
-   Avoid hardcoded theme-specific colors inside individual components.
    Use shared CSS variables/design tokens.
-   Ensure charts, dropdowns, dialogs, inputs, borders, hover states,
    and skeletons work in both themes.
-   Use smooth but subtle transitions; avoid flashing during initial
    theme load.

### UI style

-   Clean typography and generous spacing.
-   Clear visual hierarchy.
-   Rounded corners, but do not make every element excessively
    pill-shaped.
-   Subtle shadows only where useful.
-   Minimal, consistent iconography.
-   Use restrained animations for hover, loading, and page transitions.
-   Avoid clutter, excessive gradients, glassmorphism, and decorative
    animations.
-   Make the search box the main visual focus on the homepage.

## Confirmed technology stack

  Layer                    Technology
  ------------------------ -------------------------------------------
  Frontend                 Vue 3 + Vite
  Language                 TypeScript
  Styling                  Tailwind CSS v4
  Routing                  Vue Router
  State management         Pinia
  Hosting                  Cloudflare Pages
  Backend/API              Cloudflare Workers
  Database                 Cloudflare D1 (SQLite / SQL)
  File storage             Cloudflare R2
  Authentication           Firebase Authentication
  Authentication methods   Google sign-in and email/password
  AI                       External LLM API; provider to be selected
  Video resources          YouTube Data API
  Web resources            Search API; provider to be selected
  Payments                 Razorpay, planned for a later phase

### Architecture rules

1.  Vue frontend is hosted on Cloudflare Pages.
2.  Frontend calls Cloudflare Workers APIs.
3.  Firebase Authentication handles sign-in and account creation.
4.  After login, frontend obtains a Firebase ID token.
5.  Frontend sends the ID token as a Bearer token to protected Worker
    endpoints.
6.  Workers verify the Firebase ID token server-side before trusting the
    user identity.
7.  Workers access D1 and R2 using Cloudflare bindings.
8.  AI, YouTube, web search, and payment secrets stay on the server
    side.
9.  Never trust a user ID supplied only in a request body. Derive the
    authenticated user identity from the verified token.
10. Use D1 for relational application data; use R2 for uploaded files.
    Do not store large file contents in D1.

### Cost principles

-   Prioritize free tiers, but do not assume every service is unlimited
    or permanently free.
-   Add rate limits and per-user usage limits to AI endpoints.
-   Cache suitable search and AI results where safe.
-   Avoid unnecessary repeated database reads and writes.
-   Use pagination for resource lists and search history.
-   Add upload size/type restrictions.
-   Configure billing alerts where a provider requires a billing
    account.
-   Never promise unlimited AI usage under a low-cost subscription.
-   Keep a provider-agnostic service layer so AI/search providers can be
    changed later.

## Coding standards

-   Use Vue 3 Composition API with `<script setup lang="ts">`.
-   Prefer small, reusable components.
-   Keep API calls in service modules, not scattered throughout
    components.
-   Keep authentication state in a dedicated Pinia store.
-   Keep theme state in a dedicated store or composable.
-   Use typed interfaces for API requests and responses.
-   Validate and sanitize inputs on the backend.
-   Add clear error handling and user feedback.
-   Use environment variables and Cloudflare secrets for server-side
    credentials.
-   Include `.env.example` with placeholder names only; never include
    real secrets.
-   Keep database schema changes in versioned D1 migration files.
-   Add useful README instructions as the project grows.

------------------------------------------------------------------------

# Section 2 --- Product Overview and Feature Scope

## Core problem

Students often waste time searching across multiple websites for good
explanations, videos, notes, and practice material. They also struggle
to divide a large learning goal into manageable daily tasks and maintain
consistency.

StudyMate AI should bring these activities into one platform.

## Main user journey

1.  A student visits the homepage.
2.  The student searches for a topic or explores the platform.
3.  The platform displays organized resources and an AI-assisted
    explanation.
4.  The student can save useful resources.
5.  The student can create a learning goal and, in the paid tier,
    generate a day-wise/time-wise study plan.
6.  The student completes tasks and tracks progress.
7.  The student can upload notes and generate summaries or quizzes,
    subject to usage limits and plan access.

## Main modules

1.  Public landing website.
2.  Authentication.
3.  Student dashboard.
4.  AI learning search.
5.  Resource library / saved resources.
6.  Study planner.
7.  Progress tracking and analytics.
8.  Notes summarizer.
9.  Quiz generator.
10. Subscription and usage management.
11. User settings and profile.

## MVP priority

Build in this order:

-   Foundation and public website.
-   Authentication and protected dashboard.
-   AI search and real resource discovery.
-   Saved resources and recent searches.
-   Basic progress tracking.
-   Premium study planner.
-   Notes summarizer.
-   Quiz generator.
-   Payments and subscription management.

Do not build payment integration before the core product has a useful
working experience.

------------------------------------------------------------------------

# Section 3 --- Public Website / Landing Page

## Goal

Create a premium, responsive landing page that explains StudyMate AI and
encourages students to try the search experience or sign up.

## Required sections

### 1. Navbar

-   StudyMate AI logo/wordmark.
-   Navigation links: Home, Features, How It Works, Pricing.
-   Theme toggle.
-   Login link.
-   Primary CTA: Get Started.
-   Responsive mobile menu.

### 2. Hero section

Suggested copy:

**Headline:** Your learning journey, all in one place.

**Subheading:** Discover the best resources, understand difficult
concepts, and turn your learning goals into a plan you can actually
follow.

Include a prominent search input with placeholder:

`What do you want to learn today?`

Add a few example searches, such as:

-   Learn Python from scratch
-   Operating System --- Deadlocks
-   Machine Learning --- Regression
-   Data Structures and Algorithms

The search CTA should work. If search is not implemented yet, show a
clear coming-soon state rather than pretending it works.

### 3. Features overview

Show feature cards for:

-   AI Learning Search.
-   Personalized Study Planner.
-   Notes Summarizer.
-   Progress Tracking.
-   Saved Learning Resources.
-   AI Quiz Generator.

Each card should have a concise explanation and consistent iconography.

### 4. How it works

Show a simple three-step flow:

1.  Search what you want to learn.
2.  Explore organized learning resources.
3.  Build a plan and track your progress.

### 5. Pricing preview

Show Free and Premium plans. Clearly label prices as proposed until
finalized.

### 6. Final CTA

Encourage users to start learning.

### 7. Footer

Include product links, feature links, pricing, contact placeholder,
privacy policy placeholder, and terms placeholder.

## Acceptance criteria

-   Responsive on desktop, tablet, and mobile.
-   Both themes work.
-   Navigation links work.
-   Search input has a clear action.
-   Buttons do not lead to dead links.
-   Good visual hierarchy and consistent spacing.
-   No fake testimonials, fake ratings, or unsupported claims.

------------------------------------------------------------------------

# Section 4 --- Authentication

## Goal

Allow students to create accounts and sign in securely using Firebase
Authentication.

## Authentication methods

-   Google sign-in.
-   Email and password.
-   Email verification.
-   Forgot password.
-   Logout.

Use Firebase Authentication SDK on the frontend. Use Firebase's
supported verification and password-reset flows initially. Custom email
OTP is not part of the first MVP; it can be considered later with a
transactional email provider.

## Pages

### Signup

-   Name.
-   Email.
-   Password.
-   Confirm password if appropriate.
-   Google sign-up button.
-   Terms/privacy acknowledgement.
-   Validation and useful error messages.

### Login

-   Email.
-   Password.
-   Google login.
-   Forgot password link.
-   Link to signup.

### Email verification

-   Explain that verification is required.
-   Provide resend verification action with cooldown.
-   Provide a refresh/check status action.

### Forgot password

-   Email input.
-   Send reset email.
-   Generic confirmation message that avoids exposing whether an account
    exists.

## Security requirements

-   Never store passwords in D1.
-   Never store Firebase private credentials in the frontend.
-   Use Firebase ID tokens for authenticated API requests.
-   Verify tokens inside Cloudflare Workers using a maintained and
    appropriate server-side verification approach.
-   Do not accept unverified user IDs from the browser.
-   Protect dashboard routes in the frontend and protected API routes on
    the backend.
-   Apply sensible rate limits to authentication-adjacent endpoints.
-   Do not treat hiding a page in Vue Router as backend authorization.

## User profile synchronization

After successful first login, create or upsert a user profile in D1.

Suggested user fields:

-   `id` --- Firebase UID.
-   `name`.
-   `email`.
-   `avatar_url`.
-   `created_at`.
-   `updated_at`.
-   `subscription_tier` --- default `free`.
-   `onboarding_completed`.

Do not duplicate sensitive authentication credentials in D1.

## Acceptance criteria

-   Google sign-in works.
-   Email/password signup and login work.
-   Verification and password reset flows work.
-   Protected pages require authentication.
-   Worker rejects missing or invalid Firebase tokens.
-   User profile is created/updated safely in D1.
-   Logout clears the client authentication state.

------------------------------------------------------------------------

# Section 5 --- Authenticated Student Dashboard

## Goal

Create the central workspace students see after login.

## Dashboard layout

Use a responsive sidebar on desktop and a suitable mobile navigation
pattern.

### Sidebar navigation

-   Overview.
-   AI Search.
-   My Learning.
-   Study Planner.
-   Notes Summarizer.
-   My Resources.
-   Progress & Analytics.
-   Subscription.
-   Settings.

### Dashboard overview content

-   Greeting and student name.
-   Today's date.
-   Active learning goals.
-   Today's study tasks.
-   Overall progress.
-   Current streak (only if calculated from real activity).
-   Recent searches.
-   Recently saved resources.
-   Upcoming tasks.

## Important UI states

-   First-time user with no data.
-   Returning user with existing activity.
-   Loading skeletons.
-   API error state with retry.
-   Empty search history.
-   Empty saved resources.
-   Free-tier usage limit reached.

## Data rules

-   Every record must belong to the authenticated Firebase UID.
-   Dashboard data must be loaded through authenticated Worker
    endpoints.
-   Do not use hardcoded user data in the final implementation.
-   Use mock data only during visual prototyping and clearly isolate it.

## Acceptance criteria

-   Sidebar navigation works.
-   Dashboard is responsive.
-   Theme toggle works.
-   Dashboard displays real user-specific data once APIs are connected.
-   Empty/loading/error states are implemented.

------------------------------------------------------------------------

# Section 6 --- AI Learning Search

## Goal

A student enters a topic and receives a structured learning package.

Example query:

`Operating System — Deadlock`

## Search results layout

Organize the result into sections or tabs:

1.  AI Overview.
2.  YouTube Videos.
3.  Articles and Tutorials.
4.  Documentation.
5.  Notes / PDFs / Study Material.
6.  Related Topics.
7.  Practice Questions (can be added in a later phase).

## AI Overview

Provide:

-   Simple explanation.
-   Key concepts.
-   Prerequisites.
-   Important terminology.
-   Suggested learning order.
-   Related topics.
-   Links/citations for factual claims where applicable.

The AI should distinguish between sourced facts and generated
explanations. Avoid unsupported claims.

## YouTube integration

Use the YouTube Data API from the backend.

Requirements:

-   Search relevant videos.
-   Display title, channel, thumbnail, duration if available, and real
    YouTube URL.
-   Clearly distinguish official channels from other channels only when
    supported by metadata.
-   Cache suitable search responses.
-   Handle quota exhaustion gracefully.
-   Never fabricate video IDs or links.

## Web resource integration

Use a web search provider selected during implementation.

Requirements:

-   Search from the backend.
-   Display title, source/domain, short snippet, and real URL.
-   Categorize results where possible.
-   Preserve source attribution.
-   Cache results when permitted by the provider's terms.
-   Do not generate fake URLs.

## Search history

-   Save searches for authenticated users.
-   Show recent searches in the dashboard.
-   Allow users to reopen a previous search.
-   Allow deletion of search history.
-   Paginate long histories.

## Saved resources

-   Allow saving and unsaving a resource.
-   Store title, URL, source type, thumbnail (if permitted), and
    relevant metadata.
-   Associate saved resources with the authenticated user.

## Cost controls

-   Debounce search input where appropriate.
-   Apply per-user rate limits.
-   Cache provider results.
-   Limit result counts.
-   Avoid calling the LLM for tasks that do not need an LLM.
-   Set maximum prompt and response sizes.
-   Track usage by user and endpoint.

## Acceptance criteria

-   Search returns real results from connected providers.
-   Results are grouped clearly.
-   Search history is user-specific.
-   Save/unsave works.
-   Errors and API quota limits are handled clearly.
-   No secrets are exposed in browser requests.

------------------------------------------------------------------------

# Section 7 --- Study Planner (Premium)

## Goal

Help a student turn a learning goal into a realistic study schedule.

## Example user goal

`I want to complete Machine Learning fundamentals in 7 days.`

## Planner inputs

-   Topic or subject.
-   Target completion date or number of days.
-   Available study time per day.
-   Preferred study days.
-   Current skill level.
-   Optional existing knowledge.
-   Optional exam/deadline date.

Keep the setup simple. Ask for only the information needed to generate a
useful plan.

## Generated plan

The AI should create:

-   Learning phases.
-   Day-wise topics.
-   Task descriptions.
-   Estimated duration.
-   Recommended resources.
-   Practice/revision sessions.
-   Milestones.
-   Final revision or assessment.

Example:

  Day   Topic                         Estimated time
  ----- --------------------------- ----------------
  1     Python fundamentals                  2 hours
  2     NumPy and Pandas                     2 hours
  3     Mathematics foundations              2 hours
  4     Regression                           2 hours
  5     Classification                       2 hours
  6     Clustering                           2 hours
  7     Revision and mini-project            2 hours

This is illustrative only; generated plans should depend on the
student's actual inputs.

## Planner functionality

-   View plan by day and week.
-   Mark tasks complete/incomplete.
-   Edit tasks.
-   Pause or archive a plan.
-   Regenerate or reschedule remaining tasks.
-   Show completion percentage.
-   Show overdue tasks without shaming the student.
-   Keep completed work intact when rescheduling.

## Rescheduling behavior

If a student misses a day, offer to redistribute incomplete tasks across
remaining available days. Do not silently change the schedule.

## Premium access

Study planner is proposed as a Premium feature. Enforce access on the
backend, not only in the UI.

## Acceptance criteria

-   Plan is generated from user inputs.
-   Tasks are saved in D1.
-   Task completion persists.
-   Progress is calculated from actual tasks.
-   Rescheduling requires user confirmation.
-   Free users see a clear upgrade prompt without losing their input.

------------------------------------------------------------------------

# Section 8 --- Progress Tracking and Analytics

## Goal

Help students understand their learning consistency and completion.

## Metrics

-   Active learning goals.
-   Completed tasks.
-   Pending tasks.
-   Completion percentage.
-   Study time, only if reliably recorded.
-   Daily/weekly activity.
-   Learning streak, based on a clearly defined rule.
-   Topic-wise progress.

## Visualizations

-   Weekly activity chart.
-   Plan completion chart.
-   Topic progress indicators.
-   Daily task completion.

Use a lightweight chart library only if needed. Ensure charts are
readable in both light and dark themes.

## Data integrity

-   Calculate metrics from persisted records.
-   Do not invent study time.
-   Define how a task becomes complete.
-   Avoid double-counting.
-   Handle timezone and date boundaries consistently.

## Acceptance criteria

-   Metrics reflect actual user data.
-   Charts have empty and loading states.
-   User data is isolated.
-   Dashboard and planner show consistent progress.

------------------------------------------------------------------------

# Section 9 --- Notes Summarizer

## Goal

Allow students to upload notes and convert them into concise, useful
revision material.

## Supported inputs for initial version

-   PDF.
-   Plain text.
-   DOCX only if a reliable extraction library is selected and tested.

Do not claim support for a file type until extraction is implemented.

## User flow

1.  Student selects or drops a file.
2.  Validate file type and size.
3.  Upload file to R2 using a secure Worker-mediated flow or short-lived
    signed upload URL.
4.  Extract text in a suitable backend processing step.
5.  Send extracted text to the selected LLM provider.
6.  Display generated summary.
7.  Save summary metadata and file reference for the user.

## Summary output

-   Short overview.
-   Topic-wise notes.
-   Key definitions.
-   Important points.
-   Formulas (when relevant).
-   Examples (when useful).
-   Possible exam questions.
-   Quick revision sheet.

## Requirements

-   Show upload and processing progress.
-   Handle scanned PDFs separately; OCR may be a later feature.
-   Enforce file size and page/text limits.
-   Avoid sending unnecessarily large documents to the LLM.
-   Allow users to delete uploaded files and summaries.
-   Never expose R2 credentials or publicize private uploads by default.
-   Explain when extraction fails.

## Premium access

Basic summarization may have a limited free allowance; advanced or
higher-volume usage can be Premium. Final limits should be based on
actual provider costs.

------------------------------------------------------------------------

# Section 10 --- AI Quiz Generator

## Goal

Generate practice questions from a topic or a student's notes.

## Question types

-   Multiple-choice questions.
-   True/false.
-   Short-answer questions.
-   Topic-wise practice sets.

## Quiz experience

-   Select topic or source notes.
-   Choose difficulty.
-   Choose number of questions.
-   Answer questions.
-   Submit and see score.
-   Show explanations for answers.
-   Save quiz history.

## Quality rules

-   Avoid ambiguous questions.
-   Ensure only one correct answer for single-answer MCQs.
-   Provide explanations.
-   Do not claim generated questions are official exam questions.
-   Make it clear that AI-generated answers can contain mistakes.

------------------------------------------------------------------------

# Section 11 --- Pricing and Subscription

## Proposed pricing (not final)

### Free

-   Basic AI search with usage limits.
-   Limited resource discovery.
-   Recent searches.
-   Basic explanations.
-   Limited note summaries, if cost permits.
-   Basic dashboard.

### Premium

Proposed starting price: **₹79/month**.

Potential benefits:

-   Personalized study planner.
-   Time-wise schedule.
-   Progress analytics.
-   Higher summarization allowance.
-   AI quiz generation.
-   Higher AI usage allowance.

## Payment integration

Use Razorpay only after the core product is validated.

Requirements:

-   Create payment orders on the backend.
-   Verify payment signatures on the backend.
-   Never trust a frontend success message as proof of payment.
-   Store subscription status and transaction references in D1.
-   Handle failed, pending, successful, cancelled, and refunded
    payments.
-   Enforce Premium access in Worker APIs.
-   Do not store card details.

## Cost and margin controls

-   Define monthly AI credits.
-   Track usage per user.
-   Set maximum upload sizes and processing limits.
-   Cache eligible responses.
-   Monitor search-provider quotas.
-   Review actual costs before setting final subscription limits.

------------------------------------------------------------------------

# Section 12 --- Database Design (Initial Proposal)

Use Cloudflare D1 with versioned SQL migrations.

All user-owned records should be scoped to the Firebase UID.

Suggested tables:

## `users`

-   `id` TEXT PRIMARY KEY --- Firebase UID.
-   `name` TEXT.
-   `email` TEXT.
-   `avatar_url` TEXT.
-   `subscription_tier` TEXT DEFAULT 'free'.
-   `onboarding_completed` INTEGER DEFAULT 0.
-   `created_at` TEXT.
-   `updated_at` TEXT.

## `user_preferences`

-   `id` TEXT PRIMARY KEY.
-   `user_id` TEXT NOT NULL.
-   `theme` TEXT.
-   `timezone` TEXT.
-   `daily_study_goal_minutes` INTEGER.
-   `created_at` TEXT.
-   `updated_at` TEXT.

## `searches`

-   `id` TEXT PRIMARY KEY.
-   `user_id` TEXT NOT NULL.
-   `query` TEXT NOT NULL.
-   `created_at` TEXT NOT NULL.

## `resources`

-   `id` TEXT PRIMARY KEY.
-   `user_id` TEXT NOT NULL.
-   `title` TEXT NOT NULL.
-   `url` TEXT NOT NULL.
-   `source_type` TEXT.
-   `thumbnail_url` TEXT.
-   `metadata_json` TEXT.
-   `created_at` TEXT.

## `study_plans`

-   `id` TEXT PRIMARY KEY.
-   `user_id` TEXT NOT NULL.
-   `title` TEXT NOT NULL.
-   `goal_description` TEXT.
-   `start_date` TEXT.
-   `target_date` TEXT.
-   `status` TEXT.
-   `created_at` TEXT.
-   `updated_at` TEXT.

## `plan_tasks`

-   `id` TEXT PRIMARY KEY.
-   `plan_id` TEXT NOT NULL.
-   `user_id` TEXT NOT NULL.
-   `title` TEXT NOT NULL.
-   `description` TEXT.
-   `scheduled_date` TEXT.
-   `estimated_minutes` INTEGER.
-   `status` TEXT.
-   `completed_at` TEXT.
-   `sort_order` INTEGER.

## `notes`

-   `id` TEXT PRIMARY KEY.
-   `user_id` TEXT NOT NULL.
-   `file_key` TEXT.
-   `original_filename` TEXT.
-   `mime_type` TEXT.
-   `file_size_bytes` INTEGER.
-   `summary_text` TEXT.
-   `status` TEXT.
-   `created_at` TEXT.
-   `updated_at` TEXT.

## `subscriptions`

-   `id` TEXT PRIMARY KEY.
-   `user_id` TEXT NOT NULL.
-   `provider` TEXT.
-   `provider_reference` TEXT.
-   `plan` TEXT.
-   `status` TEXT.
-   `current_period_start` TEXT.
-   `current_period_end` TEXT.
-   `created_at` TEXT.
-   `updated_at` TEXT.

## `usage_logs`

-   `id` TEXT PRIMARY KEY.
-   `user_id` TEXT NOT NULL.
-   `feature` TEXT NOT NULL.
-   `units_used` INTEGER DEFAULT 1.
-   `metadata_json` TEXT.
-   `created_at` TEXT NOT NULL.

Add appropriate foreign keys, indexes, constraints, and deletion
behavior in actual migrations. Review whether a separate
`saved_resources` table is preferable to using `resources` for saved
items. Avoid duplicating the same resource unnecessarily.

This schema is a starting proposal. Refine it based on actual API and UI
requirements before production.

------------------------------------------------------------------------

# Section 13 --- Backend API Design (Initial Proposal)

Use Cloudflare Workers with clear route modules.

Suggested endpoints:

## Authentication / profile

-   `GET /api/me` --- return authenticated user profile.
-   `PATCH /api/me` --- update allowed profile fields.
-   `PATCH /api/me/preferences` --- update preferences.

Firebase handles authentication flows. Workers verify Firebase ID
tokens.

## Search

-   `POST /api/search` --- search a topic and return organized
    resources.
-   `GET /api/search/history` --- list recent searches.
-   `DELETE /api/search/history/:id` --- delete a search.

## Resources

-   `GET /api/resources/saved` --- list saved resources.
-   `POST /api/resources/saved` --- save a resource.
-   `DELETE /api/resources/saved/:id` --- unsave a resource.

## Planner

-   `POST /api/plans` --- generate/create a plan.
-   `GET /api/plans` --- list plans.
-   `GET /api/plans/:id` --- get a plan and tasks.
-   `PATCH /api/plans/:id` --- update plan.
-   `POST /api/plans/:id/reschedule` --- request a reschedule.
-   `PATCH /api/tasks/:id` --- update task status/details.

## Notes

-   `POST /api/notes/upload` --- initiate a secure upload.
-   `POST /api/notes/:id/summarize` --- process and summarize.
-   `GET /api/notes` --- list notes.
-   `GET /api/notes/:id` --- get note and summary.
-   `DELETE /api/notes/:id` --- delete note and its R2 object.

## Usage and subscription

-   `GET /api/usage` --- current usage.
-   `GET /api/subscription` --- subscription details.
-   Payment endpoints will be added in the payment phase.

For every protected endpoint:

-   Verify the Firebase ID token.
-   Derive the UID from the verified token.
-   Validate request data.
-   Enforce ownership in every database query.
-   Apply rate limits and feature usage checks.
-   Return consistent error responses.
-   Never expose stack traces, secrets, or internal provider errors to
    users.

------------------------------------------------------------------------

# Section 14 --- Environment Variables and Secrets

Use local development variables and Cloudflare Worker secrets
appropriately.

## Frontend public Firebase configuration

Firebase web app configuration is designed to be included in the
frontend, but security must rely on Firebase rules/configuration and
server-side authorization---not secrecy of the web config.

Example `.env.example`:

``` env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=http://localhost:8787
```

Do not put private service-account credentials or AI API keys in `VITE_`
variables.

## Worker secrets / bindings

Examples of server-side secrets:

``` text
FIREBASE_PROJECT_ID
AI_API_KEY
YOUTUBE_API_KEY
WEB_SEARCH_API_KEY
RAZORPAY_KEY_SECRET
```

Use Cloudflare secrets for sensitive values. Use `wrangler.jsonc` for
non-secret configuration and bindings such as D1 and R2.

Never commit real `.env` files, service-account JSON files, API keys, or
payment secrets.

------------------------------------------------------------------------

# Section 15 --- Deployment and Operations

## Frontend

-   Build Vue app with Vite.
-   Deploy static output to Cloudflare Pages.
-   Configure SPA fallback/routing correctly.
-   Add production environment variables.
-   Test direct navigation to nested routes.

## Backend

-   Deploy Cloudflare Worker.
-   Configure D1 binding.
-   Configure R2 binding.
-   Apply D1 migrations to the correct environment.
-   Add server-side secrets.
-   Configure allowed frontend origins/CORS.
-   Test protected routes and token verification.

## Firebase

-   Create Firebase project.
-   Register web application.
-   Enable Google provider.
-   Enable Email/Password provider.
-   Configure authorized domains.
-   Configure email templates and verification settings.
-   Test local and production authentication.

## Operations

-   Add structured logging without sensitive data.
-   Monitor Worker errors and request usage.
-   Monitor D1 and R2 usage.
-   Monitor third-party API quotas.
-   Configure billing alerts where applicable.
-   Keep a record of production configuration and deployment steps.

------------------------------------------------------------------------

# Section 16 --- Definition of Done for Every Phase

Before moving to the next phase, check:

-   [ ] The feature works locally.
-   [ ] The feature works at common mobile and desktop sizes.
-   [ ] Light theme works.
-   [ ] Dark theme works.
-   [ ] Loading state exists.
-   [ ] Empty state exists where relevant.
-   [ ] Error state exists.
-   [ ] Forms validate input.
-   [ ] Protected endpoints verify identity.
-   [ ] User data is isolated by authenticated UID.
-   [ ] No secrets are exposed in frontend code.
-   [ ] No fake integrations are presented as real.
-   [ ] Existing features still work.
-   [ ] README/setup instructions are updated.
-   [ ] Changes are committed to Git.

------------------------------------------------------------------------

# Section 17 --- First Prompt to Give Your Vibe-Coding Tool

Copy this prompt first, after providing Section 1:

> We are starting StudyMate AI. Read the project specification and
> follow its global instructions.
>
> First, inspect the current workspace. If it is empty, initialize the
> Vue 3 + Vite + TypeScript project using Vue Router, Pinia, Tailwind
> CSS v4, ESLint, and Prettier.
>
> For this first task, implement only the frontend foundation:
>
> 1.  Set up the project structure.
> 2.  Configure Tailwind CSS v4.
> 3.  Create a centralized design-token/theme system.
> 4.  Implement the warm cream light theme and black/charcoal dark
>     theme.
> 5.  Add a reusable theme toggle with Light, Dark, and System options.
> 6.  Persist the selected theme and avoid a flash of the wrong theme on
>     page load.
> 7.  Create reusable buttons, inputs, cards, badges, and basic layout
>     components.
> 8.  Add Vue Router and Pinia.
> 9.  Create placeholder routes for Home, Features, Pricing, Login,
>     Signup, and Dashboard.
> 10. Make the foundation responsive and accessible.
>
> Do not implement Firebase, Cloudflare APIs, AI search, payments, or
> database integration in this task.
>
> Use clean, reusable components and the visual direction in the
> specification. Do not use the typical blue-purple AI gradient style.
>
> After implementation, explain the files created, commands to run, and
> any setup still required. Run the available checks and fix errors
> before finishing.

------------------------------------------------------------------------

# Section 18 --- Follow-up Prompts (Use One at a Time)

After the foundation is complete, give these prompts sequentially.

### Prompt 2 --- Landing page

> Implement the public StudyMate AI landing page according to Section 3.
> Follow the cream/black theme system, use reusable components, and
> ensure all navigation and CTAs behave correctly. Use realistic product
> copy, responsive layouts, and polished empty/placeholder states. Do
> not implement backend functionality yet.

### Prompt 3 --- Firebase authentication

> Implement Firebase Authentication according to Section 4. Add Google
> sign-in, email/password signup and login, email verification, password
> reset, logout, auth state management in Pinia, and protected Vue
> routes. Create an environment example and setup documentation. Do not
> expose private credentials. Keep Worker token verification as a
> separate backend task.

### Prompt 4 --- Cloudflare backend foundation

> Implement the Cloudflare Workers backend using TypeScript and
> Wrangler. Set up D1 and R2 bindings, migrations, a health endpoint,
> Firebase ID token verification middleware, CORS, input validation,
> consistent error handling, and an authenticated GET /api/me endpoint.
> Create or upsert the user's profile using the verified Firebase UID.
> Never trust a UID supplied by the client. Document local development
> and deployment.

### Prompt 5 --- Dashboard

> Implement the authenticated student dashboard according to Section 5.
> Connect it to real profile/API data where available. Include sidebar
> navigation, overview cards, recent activity, loading/empty/error
> states, responsive mobile navigation, and both themes. Do not
> fabricate analytics or activity.

### Prompt 6 --- AI learning search

> Implement AI Learning Search according to Section 6. First build the
> provider abstraction and backend API contract. Integrate YouTube Data
> API and a selected web search provider through Cloudflare Workers.
> Keep API keys server-side, cache eligible responses, add per-user
> limits, and return real source URLs with attribution. Add search
> history and saved resources backed by D1. Do not fabricate results or
> links. If provider credentials are missing, implement the integration
> boundary and setup guide rather than pretending the integration works.

### Prompt 7 --- Study planner

> Implement the Premium Study Planner according to Section 7. Build the
> plan setup flow, AI-generated day-wise tasks, D1 persistence, task
> completion, plan editing, progress calculation, and user-confirmed
> rescheduling. Enforce Premium access on the backend. If AI credentials
> are unavailable, keep the AI provider interface isolated and clearly
> mark the development fallback.

### Prompt 8 --- Progress tracking

> Implement Progress Tracking according to Section 8 using real saved
> plans and task completion data. Add weekly and topic-wise views,
> accurate completion calculations, and responsive charts that support
> both themes. Do not invent study time or activity.

### Prompt 9 --- Notes summarizer

> Implement Notes Summarizer according to Section 9. Add secure file
> validation and R2 upload, text extraction for supported file types,
> summarization through the selected LLM provider, D1 metadata
> persistence, processing states, deletion, and usage limits. Do not
> claim OCR or scanned-PDF support unless it is actually implemented and
> tested.

### Prompt 10 --- Quiz generator

> Implement AI Quiz Generator according to Section 10. Support
> topic-based and notes-based question generation, difficulty selection,
> quiz attempts, scoring, answer explanations, and saved quiz history.
> Clearly label generated questions as AI-generated.

### Prompt 11 --- Payments

> Implement Razorpay subscriptions according to Section 11. Create
> orders server-side, verify payment signatures server-side, store
> subscription status in D1, handle payment lifecycle states, and
> enforce Premium access in Worker APIs. Do not trust client-side
> payment success. Add test-mode instructions before production setup.

### Prompt 12 --- Final quality review

> Audit the complete StudyMate AI project. Check responsive behavior,
> accessibility, both themes, authentication security, Worker
> authorization, D1 ownership checks, R2 file privacy, API error
> handling, rate limits, usage controls, environment variable safety,
> deployment configuration, and README instructions. Fix confirmed
> issues and provide a concise list of any remaining limitations. Do not
> claim a feature is production-ready unless it has been tested.

------------------------------------------------------------------------

## Final product decisions

  -----------------------------------------------------------------------
  Decision                            Status
  ----------------------------------- -----------------------------------
  Product name                        StudyMate AI

  Frontend                            Vue 3 + Vite + TypeScript

  Styling                             Tailwind CSS v4

  Theme                               Warm cream light / black dark

  Hosting                             Cloudflare Pages

  Backend                             Cloudflare Workers

  Database                            Cloudflare D1

  File storage                        Cloudflare R2

  Authentication                      Firebase Auth

  Google login                        Planned

  Email/password                      Planned

  AI search                           Planned

  YouTube resources                   YouTube Data API

  Study planner                       Premium feature

  Notes summarizer                    Limited free / advanced Premium
                                      proposal

  Progress tracking                   Core feature; advanced analytics
                                      proposed Premium

  Initial Premium price               ₹79/month proposed

  Payments                            Razorpay, later phase
  -----------------------------------------------------------------------

**Build philosophy:** Ship a useful, reliable MVP first. Keep the
architecture modular, the UI polished, the AI usage controlled, and
every paid feature enforced by the backend.
