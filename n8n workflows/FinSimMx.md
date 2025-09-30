Project summary
Build a responsive B2B Financial Planning & Analytics web application for companies in Mexico, inspired by Abacum.ai. Primary users: finance teams (CFO, FP&A, controllers, analysts). Default language: Spanish (MX). Deliver a production-ready Firebase project scaffold (Hosting, Firestore, Functions, Auth), UI skeleton (React or Vue), CI/CD (GitHub Actions), tests and a README with deployment steps and env var instructions.

Product requirements
1) Authentication & access
 - Firebase Authentication (email/password, Google, Microsoft SSO).
 - Role-based access control with custom claims: superadmin, company_admin, analyst, viewer.
 - Multi-tenant: each user belongs to one company (companyId) and may have roles per company.

2) Core product features
 - Financial dashboards (KPIs, P&L, cash flow, balance sheet) with drill-downs.
 - Scenario modeling and forecasting (assumptions, multi-period, compare scenarios).
 - Data import/export (Excel/CSV upload & download).
 - Automated scheduled imports from public economic APIs and refreshable caches.
 - Collaboration: comments on scenarios/reports, task assignments and notifications.
 - Reports export (PDF/Excel), configurable regulatory and internal report templates.
 - Alerts/notifications when indicators cross configured thresholds.
 - Audit logs for all critical actions.

3) Localization & UX
 - Default UI language: Spanish (MX). Provide i18n scaffolding for English.
 - Currency formatting in MXN, with USD conversions where relevant.
 - Desktop-first responsive layout optimized for tablets.
 - Clean, professional dashboard design (filters, saved views, widgets).
 - Dark/light mode toggle.

4) Data integrations (Functions to fetch, transform, cache)
 - Banxico (SIE) endpoints:
   • Series endpoint: https://www.banxico.org.mx/SieAPIRest/service/v1/series/{SERIE_ID}/datos/{FECHA_INI}/{FECHA_FIN}
   • Example series to fetch (MVP): SF43718 (USD/MXN FIX), SF43783 (TIIE 28d), 0101010000 (INPC), SP68257 (UDIS)
   • Use API key in env var BANXICO_API_KEY. Respect rate limits and implement retry/backoff.
 - INEGI endpoints:
   • Indicadores endpoint template: https://www.inegi.org.mx/app/api/indicadores/desarrolladores/jsonxml/INDICATOR/{ID_INDICATOR}/es/0700/false/{API_KEY}?type=json
   • Example indicators (MVP): 383006 (quarterly GDP by activity), 493911 (consumer confidence), 493906 (business confidence), 385176 (employment)
   • Use INEGI API key in env var INEGI_API_KEY. Cache responses and version by date.
 - Datos Abiertos / Gobierno (OSINT):
   • Package search: https://datos.gob.mx/busca/api/3/action/package_search?q={QUERY}
   • Examples: RFC/company registries, trade/import-export, Compranet procurement datasets.
 - Implementation notes:
   • Use Firebase Functions (HTTP + scheduled cron) to fetch, normalize and store indicator data in Firestore.
   • Store raw API responses and normalized time-series separately.
   • Implement caching TTL (e.g., 1h for intraday FX; 24h for macro indicators) and allow manual refresh.

5) Firestore schema (proposed)
 - companies (doc id = companyId)
   • name, RFC, industry, timezone, currency, settings, createdAt
 - users (doc id = uid)
   • name, email, companyId, roles (array), lastSeen, createdAt
 - financialData (collection)
   • doc: {companyId, type: "balance_sheet"|"income_statement"|"cash_flow", period: "YYYY-MM", values: {accountCode: number}, source, uploadedBy, createdAt}
 - scenarios (collection)
   • doc: {companyId, name, assumptions: {...}, results: {...}, baseScenarioId?, createdBy, createdAt}
 - reports (collection)
   • doc: {companyId, name, type, parameters, fileUrl, generatedBy, generatedAt}
 - tasks (collection)
   • doc: {companyId, title, description, assignedToUid, status, dueDate, createdBy, createdAt}
 - comments (collection)
   • doc: {companyId, relatedTo: {type, id}, authorUid, text, createdAt}
 - externalIndicators (collection)
   • doc: {source: "banxico"|"inegi"|"gob", indicatorId, seriesId, values: [{date, value}], lastFetchedAt, rawResponseUrl?}
 - indicatorsCache (collection)
   • doc keyed by "banxico_SF43718" etc, store normalized series, metadata, ttl
 - auditLogs (collection)
   • doc: {companyId, uid, action, target, details, timestamp}
 - settings (collection)
   • doc: {companyId, integrationKeys, thresholds, scheduledJobs, currencySettings}

6) Firestore rules & security
 - Enforce company-level isolation: all reads/writes must match request.auth.token.companyId == resource.data.companyId.
 - Role checks for admin-only actions (create company, change billing, export sensitive reports).
 - Prevent raw API keys in client: all external API calls must happen in Functions.
 - Provide example security rules file and indexes for query-efficient charts.

7) Cloud Functions to implement (deliverable)
 - fetchBanxico(seriesId, startDate, endDate): normalize to {date, value}, save to externalIndicators and indicatorsCache.
 - fetchINEGI(indicatorId, params): normalize and save.
 - fetchGobData(query): package_search then extract relevant datasets.
 - scheduled jobs: cron triggers to refresh high-priority series (configurable per company).
 - transform/import: parse uploaded Excel/CSV into financialData with validation and mapping UI.
 - notifications: send push/email when thresholds triggered (integrate with Firebase Cloud Messaging and SMTP).
 - example HTTP endpoints for on-demand refresh and manual re-sync (protected by IAM).

8) Prioritized indicators for MVP (Banxico / INEGI)
 - Banxico: USD/MXN FIX (SF43718), TIIE 28d (SF43783), INPC (0101010000), UDIS (SP68257)
 - INEGI: Quarterly GDP by sector (383006), Consumer Confidence (493911), Business Confidence (493906), Employment (385176)
 - OSINT: RFC/company registry, import/export tables, Compranet notices

9) Multi-tenant & data isolation
 - Design Firestore with companyId on all business collections.
 - Provide sample tenant onboarding function that seeds default settings and data mappings.
 - Include billing placeholder (not required for MVP) and feature flags per tenant.

10) UI & front-end deliverables
 - Starter dashboard with widgets: top KPIs, FX and inflation widget, scenario selector, recent reports, tasks.
 - Scenario builder UI with assumptions panel and run button (calls backend forecast function).
 - Upload flow and mapping assistant for Excel/CSV data with validation preview.
 - Report generator view with templates and export buttons.
 - Basic admin area for integrations (enter API keys, set refresh cadence, configure alerts).

11) Observability, testing and CI/CD
 - Provide unit tests for Functions (mock API responses), integration tests for transform flows, and e2e test skeleton for core flows.
 - GitHub Actions pipeline: run tests, lint, build, deploy to Firebase Hosting & Functions on merge to main.
 - Logging & monitoring: integrate Stackdriver / Firebase logs and set alerts for function failures.

12) Deliverables expected from Firebase Studio output
 - Full project scaffold (Functions, Firestore rules, Hosting, React/Vue front-end) with working sample pages.
 - Implemented Functions for Banxico/INEGI/OSINT with example calls and caching.
 - Sample Firestore security rules and indexes.
 - README with: env vars (BANXICO_API_KEY, INEGI_API_KEY, SMTP creds), local dev steps, deploy steps, and how to set scheduled refresh cadence.
 - Sample test data and demo tenant seeded so the app runs immediately after deploy.

Non-functional requirements
 - Prioritize security, data privacy and compliance (audit logs, role separation).
 - Design for horizontal scalability and low-cost operations on Firebase.
 - Keep latency of indicator reads under 300ms via caching layer.

MVP scope for first sprint
 - Authentication & multi-tenant user onboarding.
 - Firestore schema & security rules.
 - Functions for the 4 Banxico series and 2 INEGI indicators, with scheduled refresh and caching.
 - Basic dashboard showing company-level KPIs with these indicators and a simple scenario compare view.
 - CSV/Excel import flow and PDF/Excel report export.

End note for Firebase Studio
Produce code and configuration ready to run on a Firebase project. Include clear comments on where to place API keys and how to extend series/indicators. Provide example calls in the README demonstrating how the UI pulls cached indicator data and how to trigger a manual refresh.