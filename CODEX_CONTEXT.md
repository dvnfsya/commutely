# CODEX CONTEXT — COMMUTE.LY

## 1. PROJECT IDENTITY

Project name: Commute.ly
Competition: MAPID WebGIS Competition 2026
Product type: WebGIS
Primary focus: Nighttime safety for KRL users in DKI Jakarta

Commute.ly is a WebGIS platform designed to help KRL users,
especially during nighttime and early morning travel, understand
safety conditions and supporting facilities around stations and
along their journey.

The system integrates:
- spatial datasets
- field survey data
- spatial analysis
- routing
- interactive WebGIS visualization
- AI Assistant
- emergency contact information

The product is NOT intended to replace general navigation platforms.
Its differentiation is safety context for first-mile and last-mile
travel around KRL stations.

---

# 2. IMPORTANT COMPETITION REQUIREMENTS

The WebGIS must:

1. Use MAPID Maps as the primary basemap.
2. Integrate primary data from MAPID Apps / Survey Activities.
3. Retrieve MAPID primary data through backend-to-backend REST API.
4. Never expose sensitive MAPID API keys in the frontend.
5. Never expose AI API keys in the frontend.
6. Be deployed online for final judging.
7. Support interactive map visualization.
8. Use spatial analysis as the basis of Safety Score.
9. Integrate AI as an enhancer/interpreter, not as the core spatial
   analysis engine.

MAPID API requests must be performed from the backend.

Mission API:
- maximum 100 points per request
- if has_more=true, continue using offset

Activities API:
- maximum 60 records per request
- currently no offset parameter

Spatial filter:
- GeoJSON Polygon
- polygon coordinates must be closed
- first and last coordinate must be identical
- avoid unnecessarily large polygons
- simplify geometry when appropriate

---

# 3. CURRENT PRODUCT SCOPE

## IN SCOPE

- Station Safety Score
- Interactive WebGIS
- KRL stations
- railway network
- road network
- PJU
- Nighttime Light
- police facilities
- health facilities
- 24-hour retail/economic activity
- field survey data
- fastest/base route
- route safety visualization
- station safety analysis
- map layers
- station information
- KRL schedule information
- AI Assistant
- Emergency Contact
- dashboard and insights

## OUT OF SCOPE

Do NOT implement:

- CCTV integration
- native mobile application
- KRL ticketing/payment
- real-time train tracking
- AI calculation of Safety Score
- alternative routes based on Safety Score
- general-purpose chatbot outside system knowledge
- complex traffic prediction
- large-scale traffic simulation
- detailed construction/urban planning analysis
- enterprise-level user management
- unnecessary third-party integrations

IMPORTANT:
Do not add features simply because they are technically possible.
Follow the current PRD.

---

# 4. CORE PRODUCT LOGIC

## Safety Score

Safety Score is calculated by spatial analysis.

AI MUST NOT calculate Safety Score.

The conceptual flow is:

data
→ cleaning/standardization
→ spatial analysis
→ weighted safety scoring
→ Safety Score
→ visualization
→ AI interpretation

Safety Score is intended to represent safety conditions around
stations and/or road segments.

Primary indicators include:

- PJU / nighttime lighting
- Nighttime Light
- police facilities
- 24-hour retail/economic activity
- field survey results

---

# 5. SPATIAL ANALYSIS

The project uses:

## Service Area / Isochrone Analysis

Tool/API:
OpenRouteService

Purpose:
Determine effective accessibility/coverage following the road network.

---

## Spatial Join

Used to associate safety indicators with road segments.

Examples:
- PJU
- Nighttime Light
- 24-hour retail

Output:
Safety-related attributes attached to road segments.

---

## Buffer / Proximity Analysis

Used for:
- police facilities
- health facilities
- retail
- station surroundings

Purpose:
Determine nearby facilities and coverage.

---

## Weighted Safety Scoring

Inputs:
- Nighttime Light / PJU
- police facilities
- 24-hour retail
- field survey

Output:
- Safety Score
- safety classification
- map visualization

IMPORTANT:
This is a spatial/data processing function.
Do not move this responsibility into the AI layer.

---

## Base Route Analysis

API:
OpenRouteService Directions API

Purpose:
Generate one fastest/base route between:

origin → station

or

station → destination

The project currently does NOT generate alternative routes
based on Safety Score.

---

## Route-Safety Score Overlay

The base route is spatially joined with road-segment Safety Score.

Output:
A single base route whose segments are visualized according to
their Safety Score.

This is NOT an alternative route.

---

# 6. AI ASSISTANT

AI service:
Gemini API

AI role:
Interpreter / assistant.

AI receives:
- user question
- relevant summarized spatial context
- relevant Safety Score information
- relevant facility information
- FAQ / knowledge base when appropriate

AI returns:
- natural-language explanation
- contextual insight
- explanation of Safety Score
- facility information
- answers to supported questions

Examples:

"Kenapa ruas ini berwarna merah?"

"Apakah ada PJU di dekat rute saya?"

"Apa kondisi keamanan di sekitar tujuan saya?"

AI MUST NOT:
- calculate Safety Score
- generate spatial analysis independently
- determine the base route
- invent unavailable facilities
- provide unsupported information

If information is unavailable, AI should explicitly state:

"Data untuk informasi tersebut belum tersedia dalam Commute.ly."

For general platform questions, use the project's FAQ /
knowledge base.

---

# 7. DATA SOURCES

Main datasets:

PJU
Source: JakartaSatu

Police facilities
Source: BIG

Health facilities
Source: BIG

24-hour economic activity
Source: Google Maps API

Train schedule
Source: KAI / KAI Access

Road network
Source: OpenStreetMap

Railway network
Source: OpenStreetMap

KRL stations
Source: OpenStreetMap / relevant official source

Survey Activities
Source: MAPID Apps

Survey data is used to validate and enrich secondary datasets,
not simply replace them.

---

# 8. FIELD SURVEY

Study area:
43 KRL stations in DKI Jakarta.

Primary focus:
stations operating / relevant to travel between approximately
23:00–04:00.

Survey radius:
100 m around stations.

Priority stations:
4 survey object categories:

1. lighting condition
2. halte/drop-off point
3. economic activity / street vendors
4. police/security facility

Non-priority stations:
3 categories:

1. lighting condition
2. halte/drop-off point
3. economic activity / street vendors

Survey data must represent actual field observations.

Survey coordinates must correspond to the actual observed object.

Survey photographs should be clear and should not clearly expose
faces or vehicle license plates.

Survey data must be validated before integration.

---

# 9. TECHNOLOGY STACK

Frontend:
Next.js
Tailwind CSS
MapLibre GL

Backend:
FastAPI

Database:
PostgreSQL
PostGIS

Cloud database:
Supabase

Basemap:
MAPID Maps

Routing:
OpenRouteService

AI:
Gemini API

Frontend deployment:
Vercel

Repository:
GitHub

---

# 10. ARCHITECTURE

High-level architecture:

USER
 ↓
FRONTEND
Next.js + Tailwind + MapLibre
 ↓
BACKEND
FastAPI
 ↓
PostgreSQL + PostGIS

External services:

MAPID Maps
OpenRouteService
Gemini API
MAPID REST API

Sensitive API keys must remain server-side.

---

# 11. FRONTEND RESPONSIBILITIES

Frontend should handle:

- map rendering
- user interaction
- origin/destination input
- route display
- Safety Score visualization
- map layers
- station information
- facility popups
- dashboard visualization
- AI Assistant interface
- emergency contact interface

Frontend must NOT directly call protected MAPID data APIs.

---

# 12. BACKEND RESPONSIBILITIES

Backend should handle:

- API endpoints
- database communication
- spatial queries
- spatial analysis
- Safety Score processing
- route processing
- MAPID API integration
- AI API integration
- data validation
- sensitive API key management

---

# 13. DATABASE

Use PostgreSQL + PostGIS.

The database should support:

- stations
- roads
- railway
- PJU
- police
- health facilities
- retail/economic activity
- survey activities
- safety scores
- routes / route results where necessary

Use spatial indexes such as GiST when appropriate.

Optimize spatial queries.

Do not load unnecessary data into the browser.

---

# 14. PERFORMANCE

Potential browser problem:
too many spatial layers can overload memory.

Preferred mitigation:

- vector tiles where appropriate
- lazy loading
- only load layers when activated
- simplify geometries where appropriate
- spatial indexing
- limit query extent
- caching where useful

The map must remain responsive on desktop and mobile.

---

# 15. CURRENT REPOSITORY STRUCTURE

Current root:

commutely/

├── backend/
├── data/
├── docs/
├── frontend/
├── scripts/
├── .gitignore
├── README.md
└── CODEX_CONTEXT.md

Frontend currently contains:

frontend/
├── public/
├── src/
├── .env.example
├── package.json
└── README.md

Do not restructure the project unnecessarily.

Before creating new folders/files, inspect the existing repository.

---

# 16. DEVELOPMENT RULES FOR CODEX

IMPORTANT:

1. Do not rewrite the entire project unless explicitly requested.
2. Do not delete existing working functionality.
3. Inspect existing code before modifying it.
4. Reuse existing components whenever possible.
5. Follow the existing project architecture.
6. Keep frontend and backend responsibilities separated.
7. Keep secrets out of frontend code.
8. Do not hardcode API keys.
9. Do not invent datasets that are supposed to come from APIs.
10. Do not introduce unnecessary libraries.
11. Prefer small, testable changes.
12. After implementing a feature, explain:
    - files changed
    - what changed
    - how to run/test it
    - any environment variables required
13. If an architectural decision is unclear, ask before making
    a major structural change.
14. Do not implement out-of-scope features.
15. Preserve compatibility with the current PRD.

---

# 17. VIBE CODING WORKFLOW

Development is intentionally incremental.

Do NOT attempt to build the entire application in one prompt.

Preferred workflow:

1. Inspect current repository.
2. Identify current implementation status.
3. Implement ONE logical feature.
4. Run/build/test.
5. Fix errors.
6. Explain changes.
7. Wait for next instruction.

Each major feature should be independently testable.

---

# 18. CURRENT DEVELOPMENT STATUS

IMPORTANT:
Before implementing anything, inspect the repository and determine
what has already been implemented.

Do not assume the project is empty.

The previous Codex session already worked on the project.
The current state of the repository is the source of truth for
what is actually implemented.

If this context document conflicts with the existing code,
inspect the code first and report the discrepancy.

---

# 19. IMMEDIATE GOAL

Continue development from the current repository state.

Do NOT restart the project.

First inspect:
- frontend
- backend
- package.json
- existing components
- existing API routes
- existing environment examples
- README
- docs

Then provide a concise development-status summary before making
major changes.

Wait for the next implementation instruction unless a small
necessary fix is explicitly requested.