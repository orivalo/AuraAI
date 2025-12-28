# Aura AI - Comprehensive Project Report

## Executive Summary

**Aura AI** is a modern, full-stack Progressive Web Application (PWA) designed as a personal wellness companion powered by artificial intelligence. The application provides users with an AI-powered therapeutic chat interface, mood tracking capabilities, and personalized daily goal generation. Built with cutting-edge web technologies, Aura AI emphasizes security, user experience, and accessibility across multiple platforms.

**Project Name:** Aura AI  
**Version:** 0.1.0  
**License:** MIT  
**Copyright:** © 2025 [oRIVALo]  
**Status:** Production-ready

---

## 1. Project Overview

### 1.1 Purpose and Vision

Aura AI serves as a digital mental health companion that combines the power of AI-driven conversations with mood analytics and task management. The application aims to:

- Provide accessible mental health support through AI-powered conversations
- Enable users to track their emotional well-being over time
- Generate personalized daily goals based on mood patterns and chat context
- Offer a calming, therapeutic user experience through thoughtful design

### 1.2 Target Audience

- Individuals seeking mental health support and self-reflection
- Users interested in mood tracking and emotional awareness
- People looking for AI-assisted wellness guidance
- Mobile and desktop users seeking a seamless cross-platform experience

### 1.3 Core Value Proposition

- **AI-Powered Therapy**: Professional-grade AI therapist using advanced language models
- **Real-time Mood Tracking**: Automatic mood analysis from conversations
- **Personalized Goals**: AI-generated daily tasks based on emotional state
- **Privacy-First**: Secure, user-isolated data with Row Level Security
- **Multi-language Support**: English and Russian interface
- **Progressive Web App**: Installable on mobile and desktop devices

---

## 2. Technical Architecture

### 2.1 Technology Stack

#### Frontend Framework
- **Next.js 16.1.1** (App Router)
  - React Server Components and Client Components
  - Server-side rendering (SSR) and static site generation (SSG)
  - Built-in API routes
  - Image optimization
  - Font optimization with `next/font`

#### Core Technologies
- **React 19.2.3**: Latest React with concurrent features
- **TypeScript 5**: Full type safety across the application
- **Tailwind CSS 4**: Utility-first CSS framework with custom design system
- **React Compiler**: Automatic optimization via Babel plugin

#### Backend & Database
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database with Row Level Security (RLS)
  - Authentication service (Google OAuth)
  - Real-time subscriptions via WebSocket
  - RESTful API for data operations
- **Supabase SSR (@supabase/ssr 0.8.0)**: Server-side authentication handling

#### AI Integration
- **Groq SDK 0.37.0**: High-performance AI inference
  - Model: `llama-3.3-70b-versatile`
  - Fast inference with low latency
  - Free tier available

#### Data Visualization
- **Recharts 2.13.0**: React charting library
  - Line charts for mood tracking
  - Responsive and interactive visualizations

#### UI Components & Icons
- **Lucide React 0.562.0**: Modern icon library
- **Class Variance Authority**: Component variant management
- **clsx & tailwind-merge**: Conditional class name utilities

#### Validation & Security
- **Zod 4.2.1**: TypeScript-first schema validation
- Custom rate limiting implementation
- Comprehensive security headers

### 2.2 Project Structure

```
aura-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication callbacks
│   │   │   ├── chat/          # Chat API endpoint
│   │   │   └── tasks/         # Task generation endpoint
│   │   ├── login/             # Login page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── DashboardShell.tsx # Main dashboard
│   │   ├── MoodChart.tsx      # Mood visualization
│   │   ├── TasksPanel.tsx     # Task management
│   │   └── PWARegister.tsx    # Service worker registration
│   ├── contexts/              # React contexts
│   │   └── LanguageContext.tsx # i18n support
│   ├── lib/                   # Utility libraries
│   │   ├── validation.ts      # Zod schemas
│   │   ├── rate-limit.ts      # Rate limiting
│   │   ├── utils.ts           # Helper functions
│   │   └── supabase/          # Supabase clients
│   └── proxy.ts               # Route protection middleware
├── public/                    # Static assets
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── icon-*.png             # App icons
├── supabase/                  # Database schema
│   ├── migrations/            # SQL migrations
│   └── schema.sql             # Complete schema
└── Configuration files
```

### 2.3 Architecture Patterns

#### Client-Server Architecture
- **Client**: React components with client-side state management
- **Server**: Next.js API routes handling business logic
- **Database**: Supabase PostgreSQL with RLS policies

#### Authentication Flow
1. User initiates Google OAuth login
2. Supabase handles OAuth callback
3. Session stored in HTTP-only cookies
4. Middleware (proxy.ts) validates session on each request
5. Protected routes require valid authentication

#### Data Flow
1. User input → Client component
2. API route → Validation (Zod)
3. Rate limiting check
4. Supabase authentication verification
5. AI processing (Groq API)
6. Database persistence
7. Real-time updates via WebSocket subscriptions

---

## 3. Core Features

### 3.1 AI-Powered Chat Interface

**Location:** `src/components/DashboardShell.tsx`, `src/app/api/chat/route.ts`

**Functionality:**
- Conversational AI therapist powered by Groq's Llama 3.3 70B model
- Context-aware responses based on conversation history
- Multi-language support (English/Russian)
- Message persistence in Supabase
- Chat history management with multiple conversation threads
- Auto-scrolling to latest messages
- Typing indicators and loading states

**Technical Implementation:**
- System prompt designed for therapeutic conversations
- Temperature: 0.7 for balanced creativity and consistency
- Max tokens: 500 per response
- Message history limit: 100 messages
- Character limit: 10,000 per message

**Security:**
- Input validation with Zod
- XSS protection (script tag removal)
- Rate limiting: 20 requests per minute
- User authentication required
- Message sanitization before storage

### 3.2 Mood Tracking & Analytics

**Location:** `src/components/MoodChart.tsx`

**Functionality:**
- Automatic mood analysis from chat messages
- Score range: 1-10 (1 = very poor, 10 = excellent)
- Visual representation via line chart
- Last 7 entries displayed
- Real-time updates via Supabase Realtime subscriptions
- Responsive design with mobile drawer support

**Technical Implementation:**
- Separate AI analysis prompt for mood scoring
- Temperature: 0.3 for consistent scoring
- Score extraction via regex pattern matching
- Dual-layer rendering: Recharts for tooltips, custom SVG for visualization
- Client-side mounting check to prevent rendering errors

**Data Model:**
- `mood_entries` table with user_id, score, note, created_at
- Automatic entry creation on each chat message
- RLS policies ensure user data isolation

### 3.3 Daily Goals Generation

**Location:** `src/components/TasksPanel.tsx`, `src/app/api/tasks/generate/route.ts`

**Functionality:**
- AI-generated personalized daily tasks
- Context-aware generation based on:
  - Last 7 mood entries
  - Recent chat conversation history
- Task management with completion tracking
- Daily task reset (old tasks deleted before new generation)
- Maximum 5 tasks per day

**Technical Implementation:**
- Task generation prompt with mood and chat context
- JSON parsing with fallback to text parsing
- HTML tag sanitization
- Task title length limit: 500 characters
- Rate limiting: 10 requests per minute (more expensive operation)

**User Experience:**
- Checkbox interface for task completion
- Optimistic UI updates
- Loading and error states
- Empty state with generation prompt

### 3.4 Multi-language Support

**Location:** `src/contexts/LanguageContext.tsx`

**Supported Languages:**
- English (default)
- Russian

**Implementation:**
- React Context API for global language state
- LocalStorage persistence
- Browser language detection
- Comprehensive translation dictionary
- Locale-aware date formatting
- Language-aware AI responses

**Translation Coverage:**
- Navigation elements
- Chat interface
- Task management
- Mood chart
- Authentication pages
- Error messages

### 3.5 Progressive Web App (PWA)

**Location:** `public/manifest.json`, `public/sw.js`, `src/components/PWARegister.tsx`

**Features:**
- Installable on mobile and desktop
- Offline capability via service worker
- App-like experience (standalone display mode)
- Custom icons (192x192, 512x512)
- Theme color: #7C9070 (Sage green)

**Service Worker:**
- Caches static assets
- Handles GET requests only
- Excludes navigation requests
- Automatic cache cleanup
- Update detection and user prompts

**Manifest Configuration:**
- Name: "Aura AI"
- Short name: "Aura"
- Display: standalone
- Orientation: portrait-primary
- Categories: health, lifestyle, productivity

---

## 4. User Interface & Design

### 4.1 Design System: "Healing Sage"

**Color Palette:**
- Primary Sage: `#7C9070` - Main brand color
- Light Sage: `#A4B494` - Secondary elements
- Background: `#F1F4F0` - Soft sage-tinted background
- Accent: White with subtle borders

**Design Principles:**
- Calming and therapeutic aesthetic
- Soft, rounded corners (rounded-3xl)
- Subtle shadows and borders
- High contrast for accessibility
- Minimalist interface

**Typography:**
- Geist Sans: Primary font (Vercel)
- Geist Mono: Code/monospace elements
- Font optimization via `next/font`

### 4.2 Responsive Design

**Mobile-First Approach:**
- Breakpoint: 1024px (lg:)
- Mobile sidebar with hamburger menu
- Fixed top bar on mobile
- Drawer for mood chart on mobile
- Safe area insets for iOS devices
- Virtual keyboard handling

**Desktop Experience:**
- Sidebar always visible
- Two-column layout (chat + mood chart)
- Larger touch targets
- Enhanced spacing

**Key Responsive Features:**
- Dynamic padding based on viewport
- Conditional rendering for mobile/desktop
- Touch-friendly button sizes
- Optimized chart rendering

### 4.3 Component Architecture

**DashboardShell.tsx:**
- Main application shell
- Sidebar navigation
- Chat interface
- Mobile menu management
- Language switcher integration
- Chat history sidebar

**MoodChart.tsx:**
- Real-time mood visualization
- Responsive chart rendering
- Loading and error states
- Mobile drawer integration

**TasksPanel.tsx:**
- Task list management
- AI generation interface
- Completion tracking
- Empty and error states

**PWARegister.tsx:**
- Service worker registration
- PWA install prompt handling
- Update detection

---

## 5. Database Schema

### 5.1 Tables

#### `chats`
- **Purpose**: Chat session management
- **Fields**:
  - `id` (UUID, Primary Key)
  - `user_id` (UUID, Foreign Key → auth.users)
  - `created_at` (Timestamp)
- **Indexes**: user_id, created_at DESC

#### `messages`
- **Purpose**: Individual chat messages
- **Fields**:
  - `id` (UUID, Primary Key)
  - `chat_id` (UUID, Foreign Key → chats)
  - `role` (TEXT: 'user' | 'assistant')
  - `content` (TEXT)
  - `created_at` (Timestamp)
- **Indexes**: chat_id, created_at DESC
- **Constraints**: role CHECK constraint

#### `mood_entries`
- **Purpose**: Mood tracking data
- **Fields**:
  - `id` (UUID, Primary Key)
  - `user_id` (UUID, Foreign Key → auth.users)
  - `score` (INTEGER, 1-10)
  - `note` (TEXT, nullable)
  - `created_at` (Timestamp)
- **Indexes**: user_id, created_at DESC
- **Constraints**: score CHECK (1-10)

#### `tasks`
- **Purpose**: Daily task management
- **Fields**:
  - `id` (UUID, Primary Key)
  - `user_id` (UUID, Foreign Key → auth.users)
  - `title` (TEXT)
  - `completed` (BOOLEAN, default false)
  - `created_at` (Timestamp)
- **Indexes**: user_id, created_at DESC, composite (user_id, created_at DESC)

### 5.2 Row Level Security (RLS)

**All tables have RLS enabled with user-isolation policies:**

- **chats**: Users can only view/create/delete their own chats
- **messages**: Users can only access messages from their own chats
- **mood_entries**: Users can only manage their own mood entries
- **tasks**: Users can only manage their own tasks

**Policy Pattern:**
```sql
USING (auth.uid() = user_id)
```

This ensures complete data isolation between users, preventing unauthorized access even if user IDs are known.

### 5.3 Performance Optimizations

- Indexes on foreign keys and frequently queried columns
- Composite indexes for common query patterns
- CASCADE deletes for data consistency
- Timestamp-based ordering for efficient pagination

---

## 6. Security Implementation

### 6.1 Authentication & Authorization

**Authentication:**
- Google OAuth via Supabase Auth
- Session management via HTTP-only cookies
- Automatic session validation on each request
- Protected routes via middleware (proxy.ts)

**Authorization:**
- Row Level Security (RLS) at database level
- User ID verification in API routes
- Client-side session checks

### 6.2 Input Validation

**Zod Schemas:**
- `chatRequestSchema`: Validates chat messages
  - Max 10,000 characters per message
  - Max 100 messages in history
  - UUID validation for chatId
  - Language enum validation
- `taskGenerationRequestSchema`: Validates task requests
- `taskUpdateSchema`: Validates task updates

**Sanitization:**
- Script tag removal from user input
- HTML tag stripping from task titles
- Content length limits
- Type validation

### 6.3 Security Headers

**Implemented in `next.config.ts`:**

- **Strict-Transport-Security**: Forces HTTPS (max-age: 2 years)
- **X-Frame-Options**: Prevents clickjacking (SAMEORIGIN)
- **X-Content-Type-Options**: Prevents MIME sniffing (nosniff)
- **X-XSS-Protection**: XSS protection (1; mode=block)
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **Content-Security-Policy**: Restricts resource loading
  - Allows: self, Supabase domains, Groq API
  - Blocks: Inline scripts (except required for Next.js/Tailwind)

### 6.4 Rate Limiting

**Implementation:** `src/lib/rate-limit.ts`

**Limits:**
- Chat API: 20 requests/minute per client
- Task Generation API: 10 requests/minute per client

**Features:**
- In-memory storage (production: consider Redis)
- Client identification via IP + User-Agent
- Automatic cleanup of expired entries
- Rate limit headers in responses

### 6.5 Error Handling

**Sanitization:**
- Technical details logged server-side only
- Generic error messages to clients
- Error codes without sensitive information
- Whitelist for safe error messages

**Error Types:**
- Validation errors
- Authentication errors
- Internal server errors
- Unknown errors

### 6.6 Environment Variables

**Required Variables:**
- `GROQ_API_KEY`: AI API key (server-side only)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-side only)

**Security Practices:**
- No hardcoded secrets
- Environment variable validation
- Separate keys for development/production
- `.env.local` excluded from version control

---

## 7. API Endpoints

### 7.1 POST /api/chat

**Purpose:** Handle chat messages and AI responses

**Request Body:**
```typescript
{
  messages: Array<{
    id: number | string;
    text: string; // max 10,000 chars
    isUser: boolean;
  }>; // max 100 messages
  chatId?: string | null; // UUID
  language: "en" | "ru"; // default: "en"
}
```

**Response:**
```typescript
{
  text: string; // AI response
  success: boolean;
  chatId: string; // UUID
}
```

**Process:**
1. Rate limiting check
2. Authentication verification
3. Request validation (Zod)
4. Chat creation (if needed)
5. Message sanitization
6. User message storage
7. AI response generation (Groq)
8. Assistant message storage
9. Mood analysis and storage
10. Response with rate limit headers

**Rate Limit:** 20 requests/minute

### 7.2 POST /api/tasks/generate

**Purpose:** Generate personalized daily tasks

**Request Body:**
```typescript
{
  language: "en" | "ru"; // default: "en"
}
```

**Response:**
```typescript
{
  success: boolean;
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    created_at: string;
  }>;
}
```

**Process:**
1. Rate limiting check
2. Authentication verification
3. Request validation
4. Fetch last 7 mood entries
5. Fetch last 10 chat messages
6. AI task generation (Groq)
7. JSON parsing with fallback
8. Delete existing daily tasks
9. Insert new tasks
10. Return tasks with rate limit headers

**Rate Limit:** 10 requests/minute

### 7.3 GET /api/auth/callback

**Purpose:** Handle OAuth callback from Google

**Process:**
1. Exchange code for session
2. Set authentication cookies
3. Redirect to home page

---

## 8. Real-time Features

### 8.1 Supabase Realtime

**Implementation:** WebSocket subscriptions via Supabase Realtime

**Subscriptions:**
- `mood_entries` table: INSERT events
- Automatic chart updates on new mood entries
- Channel cleanup on component unmount

**Benefits:**
- Instant UI updates
- No polling required
- Efficient resource usage
- WebSocket connection via `wss://*.supabase.co`

---

## 9. Performance Optimizations

### 9.1 Code Splitting

- Dynamic imports for heavy components (MoodChart, TasksPanel)
- SSR disabled for chart components (client-only)
- Lazy loading of non-critical components

### 9.2 Image Optimization

- Next.js Image component (when used)
- Optimized PWA icons
- Proper caching headers

### 9.3 Database Optimization

- Strategic indexes on foreign keys and timestamps
- Composite indexes for common queries
- Efficient query patterns (LIMIT, ORDER BY)

### 9.4 Client-Side Optimizations

- React Compiler for automatic optimizations
- Memoization via useMemo for Supabase clients
- Ref-based DOM access for performance
- Conditional rendering to prevent unnecessary work

---

## 10. Accessibility & UX

### 10.1 Accessibility Features

- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management
- Screen reader friendly structure

### 10.2 User Experience

**Loading States:**
- Skeleton loaders during authentication
- Typing indicators in chat
- Loading spinners for async operations
- Progress feedback for all actions

**Error Handling:**
- User-friendly error messages
- Retry mechanisms
- Graceful degradation
- Empty states with helpful guidance

**Mobile Experience:**
- Touch-friendly interface
- Safe area insets for iOS
- Virtual keyboard handling
- Responsive layouts
- Mobile-optimized navigation

---

## 11. Development Workflow

### 11.1 Scripts

```json
{
  "dev": "next dev",           // Development server
  "build": "next build",       // Production build
  "start": "next start",       // Production server
  "lint": "eslint",            // Code linting
  "generate-icons": "node scripts/generate-icons.js" // Icon generation
}
```

### 11.2 TypeScript Configuration

- Strict mode enabled
- Path aliases (@/* → src/*)
- ES2017 target
- React JSX transform
- Incremental compilation

### 11.3 Linting & Code Quality

- ESLint with Next.js config
- TypeScript type checking
- Strict null checks
- No implicit any

---

## 12. Deployment Considerations

### 12.1 Environment Setup

**Required Services:**
- Next.js hosting (Vercel recommended)
- Supabase project
- Groq API account

**Environment Variables:**
- All secrets must be configured in deployment platform
- Separate keys for development/production
- Never commit `.env.local` to version control

### 12.2 Build Configuration

- React Compiler enabled
- Production optimizations
- Static asset optimization
- Service worker caching strategy

### 12.3 Monitoring Recommendations

- Error tracking (Sentry, LogRocket)
- API usage monitoring
- Rate limit violation alerts
- Performance metrics
- User analytics (privacy-compliant)

---

## 13. Future Enhancements

### 13.1 Potential Features

- Additional language support
- Export mood data (CSV/PDF)
- Advanced mood analytics
- Integration with calendar apps
- Reminder notifications
- Group therapy sessions
- Therapist notes export

### 13.2 Technical Improvements

- Redis-based rate limiting for scale
- Advanced caching strategies
- GraphQL API option
- WebSocket for real-time chat
- Advanced analytics dashboard
- A/B testing framework

---

## 14. Project Statistics

### 14.1 Codebase Metrics

- **Total Files**: ~30+ source files
- **Lines of Code**: ~3,000+ (estimated)
- **Components**: 4 main components
- **API Routes**: 3 endpoints
- **Database Tables**: 4 tables
- **RLS Policies**: 12 policies

### 14.2 Dependencies

**Production:**
- 10 core dependencies
- 7 dev dependencies
- Zero known vulnerabilities (as of audit)

**Bundle Size:**
- Optimized via Next.js
- Code splitting implemented
- Tree shaking enabled

---

## 15. Conclusion

Aura AI represents a modern, secure, and user-friendly approach to AI-powered mental health support. The application demonstrates best practices in:

- **Security**: Comprehensive RLS, input validation, rate limiting
- **User Experience**: Responsive design, multi-language support, PWA capabilities
- **Architecture**: Scalable, maintainable, type-safe codebase
- **Performance**: Optimized rendering, efficient database queries, code splitting

The project is production-ready and suitable for deployment to platforms like Vercel, with proper environment variable configuration. The MIT license allows for open-source distribution while maintaining copyright protection.

---

## Appendix A: File Structure Reference

See Section 2.2 for complete project structure.

## Appendix B: API Documentation

See Section 7 for detailed API endpoint documentation.

## Appendix C: Security Audit

See `SECURITY-AUDIT.md` for comprehensive security analysis.

## Appendix D: Database Schema

See `supabase/schema.sql` for complete database schema with RLS policies.

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Author:** Project Documentation  
**License:** MIT

