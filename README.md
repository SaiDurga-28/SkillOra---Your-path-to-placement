# SkillOra

SkillOra is a job preparation workspace for JD analysis, personalized roadmaps, assessments, communication practice, resume review, and mock interviews.

## Features

- Upload a job description and generate a preparation roadmap.
- Track dashboard progress, upcoming tasks, and skill completion.
- Practice CRT assessments and learned-skills tests.
- Practice communication with JAM and presentation modes.
- View future enhancement placeholders for group discussions and debates inside Communication.
- Run mock interviews and review resume feedback.
- Store app data locally or in MongoDB Atlas.

## Tech Stack

- React 19
- Vite
- Wouter routing
- TanStack Query
- Tailwind CSS / Radix UI components
- Node.js HTTP API
- MongoDB Atlas support with JSON-file fallback

## Project Structure

```text
.
+-- public/                 Static assets served by Vite
+-- server/                 Node API server
|   +-- controllers/        API request handlers
|   +-- data/               Local JSON database fallback
|   +-- routes/             API route dispatcher
|   +-- services/           AI, database, and skill-engine services
|   +-- index.js            API server entry point
+-- src/                    Frontend application
|   +-- api/                API clients and generated request helpers
|   +-- assets/             Frontend assets
|   +-- components/         Shared UI, layout, brand, and interview components
|   +-- hooks/              Shared React hooks
|   +-- lib/                Auth, theme, avatar, and utility helpers
|   +-- models/             Local API model and fallback logic
|   +-- views/pages/        Route pages
|   +-- App.jsx             App providers and routes
|   +-- main.jsx            Frontend entry point
+-- .env.example            Environment variable template
+-- index.html              Vite HTML entry
+-- package.json            Scripts and dependencies
+-- vite.config.js          Vite configuration
```

## Setup

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Update `.env` with your real API keys and MongoDB URI. Do not commit `.env`.

## Environment Variables

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OPENAI_VISION_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1

GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
GROQ_BASE_URL=https://api.groq.com/openai/v1

XAI_API_KEY=
XAI_MODEL=grok-4-fast
XAI_VISION_MODEL=grok-4-fast
XAI_BASE_URL=https://api.x.ai/v1

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/skillora?retryWrites=true&w=majority&appName=Skillora
MONGODB_DB=skillora
JWT_SECRET=replace-with-a-long-random-production-secret
PORT=3001
```

Notes:

- If `MONGODB_URI` is set, the API server stores data in MongoDB.
- If `MONGODB_URI` is empty, the API server falls back to `server/data/skillora-db.json`.
- Set `JWT_SECRET` to a long random value in production so auth tokens cannot be forged.
- Image JD extraction uses `OPENAI_VISION_MODEL`, `XAI_VISION_MODEL`, or `GROQ_VISION_MODEL` when configured.
- Special characters in MongoDB passwords must be URL encoded. For example, `#` becomes `%23`.

## Run Locally

Start the frontend:

```bash
npm run dev
```

Start the API server in another terminal:

```bash
npm run dev:api
```

Default URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

## Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Test And Deployment Check

Run the automated test suite:

```bash
npm test
```

Run tests and the production build together before deployment:

```bash
npm run check
```

## Main Routes

- `/` - Landing page
- `/login` - Login
- `/register` - Register
- `/dashboard` - User dashboard
- `/upload` - Job description upload
- `/jobs` - Saved jobs
- `/jobs/:jobId` - Job details
- `/roadmap/:jobId` - Roadmap view
- `/interviews` - Mock interview list
- `/interviews/:interviewId` - Interview session
- `/crt` - Assessments and communication practice
- `/resume-analyzer` - Resume analyzer
- `/settings` - User settings

## Contact

- Email: `skilloraconnect@gmail.com`
- LinkedIn: `https://www.linkedin.com/in/skill-ora-41368640a/`

## Security

Keep secrets in `.env` only. Rotate any API keys or database passwords that are accidentally shared or committed.
