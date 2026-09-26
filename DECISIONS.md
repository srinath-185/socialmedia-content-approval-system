# Technical Decisions & Architectural Rationale

This document outlines key technical decisions, alternative approaches evaluated and rejected, a challenging problem encountered during implementation and its resolution, and prospective enhancements if granted an additional week of development.

---

## 1. Three Key Technical Decisions & Alternatives Rejected

### Decision 1: Strict Three-Layer Architecture (Controller → Service → Repository) vs. Active Record / Controller-Fat Pattern
- **Decision Made**: Segregated the application into three non-leaking layers:
  1. **Controllers**: Pure presentation/HTTP layer. Thin by rule — handles route decorators, Swagger docs, parameter binding, and delegates to services. No database access or business decisions.
  2. **Services**: Pure domain orchestrator. Owns finite-state machine transitions, self-approval prevention, optimistic lock verification, and 2-hour scheduling rules. Does not interact with raw Mongoose models directly.
  3. **Repositories**: Pure data persistence. Encapsulates all database queries (`UsersRepository`, `ClientsRepository`, `PostsRepository`, `CommentsRepository`, `AuditLogsRepository`), projection (`select('-password')`), and compound index scans.
- **Alternatives Rejected**: 
  - *Active Record / Direct Mongoose Model Injection in Services*: Rejected because mixing database primitives directly into service methods tightly couples business logic to database implementation, making unit testing brittle (requiring deep Mongoose mock chains) and violating the Single Responsibility Principle.
  - *Fat Controllers*: Rejected because controllers doing business logic fail architectural review, prevent code reuse across interfaces (e.g. background schedulers, websockets), and create untestable endpoints.
- **Rationale**: Strict 3-layer isolation guarantees that domain rules are testable in complete isolation from database drivers, controllers remain purely declarative, and database queries are optimized in one central location.

---

### Decision 2: Numeric Version Increment for Optimistic Concurrency Control vs. Timestamp / ETag Based Locking
- **Decision Made**: Implemented an explicit numeric `version` property on the `Post` schema that starts at `1` and is incremented on every modification or status transition. Clients must send the current version they observed, and a version mismatch throws an HTTP `409 Conflict`.
- **Alternatives Rejected**:
  - *Pessimistic Database Row/Document Locking*: Rejected because media review workflows are human-paced; locking a post while a reviewer reads a draft would block creators from collaborating and cause deadlocks.
  - *Timestamp / `updatedAt` Comparison*: Rejected due to potential millisecond precision discrepancies across client environments, serialization rounding, and timezone translation issues.
  - *HTTP ETags / `If-Match` headers*: Valid alternative, but placing `version` directly in the request DTO (`UpdatePostDto`, `TransitionPostDto`) makes the concurrency contract explicit in Swagger, strongly typed in TypeScript, and directly testable in unit tests.
- **Rationale**: An explicit integer version is unambiguous, easy to assert in unit tests, and gives client frontends a clean path to alert the user that someone else updated the document, prompting them to fetch the freshest state without silently losing data.

---

### Decision 3: Compound Index Range Query for 2-Hour Scheduling Conflict Check vs. Time-Bucket Grouping
- **Decision Made**: Constructed a MongoDB query utilizing a compound index `{ client: 1, platform: 1, scheduledAt: 1 }` that queries posts within `[targetTime - 2 hours, targetTime + 2 hours]` for the same client and platform in `SCHEDULED` or `PUBLISHED` status.
- **Alternatives Rejected**:
  - *Fixed 2-Hour Time Slots / Buckets (e.g., 10:00–12:00, 12:00–14:00)*: Rejected because real-world posts can be scheduled at arbitrary times (e.g. 10:45 AM). Fixed time slots would allow a post at 11:55 AM and another at 12:05 PM (10 minutes apart) simply because they fall into adjacent buckets.
  - *In-Memory Array Filtering*: Rejected because pulling all scheduled posts into Node.js application memory would degrade severely as the campaign database scales.
- **Rationale**: The compound index `{ client: 1, platform: 1, scheduledAt: 1 }` allows the B-tree index in MongoDB to perform index prefix matching on client and platform, then perform an index range scan on `scheduledAt`. This makes conflict detection $O(\log N)$ and ensures the 2-hour sliding window rule is enforced with pinpoint accuracy.

---

## 2. One Bug / Problem Faced and How It Was Solved

### The Problem:
During the initial implementation, tests were mocking chained Mongoose queries directly on services:
```
TypeError: this.postModel.findById(...).populate(...).populate is not a function
```
Because Mongoose queries can chain methods (`.findById().populate().populate().exec()`), mocking Mongoose model primitives in unit tests creates tight coupling to specific method call orders and deep mock pyramids.

Furthermore, during the frontend build with Vite and TypeScript, `fe/tsconfig.app.json` had `erasableSyntaxOnly: true` enabled by default in newer Vite templates, which actively threw compile errors on standard TypeScript `enum`s (`Role`, `Platform`, `PostStatus`).

### The Solution:
1. **Repository Pattern Extraction**: Extracted all database operations into dedicated Repositories (`PostsRepository`, etc.). This cleanly decoupled the service layer: unit tests now mock clean, intention-revealing repository signatures (`findByIdPopulated`, `findConflictingPost`, `save`) rather than internal Mongoose chaining. The tests became 100% resilient and fast (running in < 3 seconds).
2. **Domain Error Codes & Typed Exceptions**: Replaced generic exception strings with a centralized `ErrorCode` enum and typed `AppError` subclasses (`ConflictAppError`, `ValidationAppError`, `ForbiddenAppError`). The global `HttpExceptionFilter` intercepts these and produces a predictable error envelope containing `{ success: false, statusCode, errorCode, message, details, timestamp }`.
3. **TypeScript Configuration Adjustment**: Updated `fe/tsconfig.app.json` to standard React + TypeScript bundler options (`moduleResolution: "bundler"`, `target: "ES2022"`), added `fe/src/vite-env.d.ts`, ensuring zero-error compilation across all TypeScript enums.

---

## 3. What I Would Improve With One More Week

If allocated an additional week of development on the platform, I would prioritize the following architectural enhancements:

1. **Real-time WebSockets / SSE for Collaborative Workflow**:
   - Integrate NestJS WebSockets (`@nestjs/websockets` with Socket.IO) to push status changes, new comments, and conflict warnings to active users in real-time. When a reviewer approves a post or requests changes, the creator's Kanban board would instantly transition the card without manual polling or page refresh.
2. **Weekly / Monthly Interactive Calendar Grid**:
   - Implement a drag-and-drop calendar view (using FullCalendar or a custom Tailwind grid) allowing social media planners to visualize scheduled campaigns across all client brands, identify publishing gaps, and detect scheduling proximities visually.
3. **Multi-Media Asset Management & CDN Uploads**:
   - Add direct image and video uploads to AWS S3 / Cloudflare R2 using pre-signed URLs, complete with client-side image aspect ratio validation (1:1 for Instagram feeds, 16:9 for LinkedIn/X, 9:16 for Reels/Stories).
4. **End-to-End (E2E) Test Suite with Playwright**:
   - Implement an automated Playwright E2E test suite running against an ephemeral MongoDB container, verifying the entire user journey: creator login → post creation → reviewer rejection with feedback → creator edit → reviewer approval → automated cron publishing.
5. **Docker Compose & Deployment Pipeline**:
   - Provide a complete multi-container `docker-compose.yml` bundling the NestJS API, React SPA (served via Nginx), and MongoDB with healthchecks for one-click staging deployments.
