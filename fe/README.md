# Conceps Media — Content Approval System Frontend

Enterprise React 19 web application built with TypeScript, Vite, and Tailwind CSS v4 for managing multi-role social media content workflows.

## Features
- **Deterministic State Workflow UI**: Kanban board and detail view reflecting posts across `DRAFT`, `IN_REVIEW`, `APPROVED`, `SCHEDULED`, and `PUBLISHED` states.
- **Client Scoping**: Dynamic reviewer filtering and permission-scoped actions.
- **Live Social Feed Mockup**: Real-time interactive previews for X (Twitter), Instagram, LinkedIn, and Facebook with platform character counter validation.
- **Discussion & Audit Timeline**: Real-time comment threads and immutable state transition history with IP and user-agent tracing.
- **Resilient Error Mapping**: Domain `ErrorCode` mapping to clear user notifications.

## Development

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Production build
npm run build
```
