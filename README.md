# 🌿 Aura AI - Your Digital Space for Peace of Mind

**Aura AI** is a modern, full-stack Progressive Web Application (PWA) designed as a personal wellness companion. It combines the power of AI-driven therapeutic conversations with mood analytics and personalized goal management, all wrapped in a calming **"Healing Sage"** aesthetic.

[![Version](https://img.shields.io/badge/version-0.1.0-7C9070)](https://github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Core Features

* **🧠 AI-Powered Therapy:** Context-aware conversations powered by **Groq (Llama 3.3 70B)**, providing accessible mental health support.
* **📈 Mood Pulse:** Real-time mood visualization using **Recharts** and **Supabase Realtime**, tracking emotional well-being over 7-day cycles.
* **📅 AI Daily Planner:** Dynamically generated daily goals based on your mood patterns and recent chat history.
* **📱 PWA Ready:** A seamless standalone experience on mobile and desktop with offline support and safe area insets for iOS.
* **🌐 Multi-language Support:** Full localization in English and Russian with local storage persistence.

## 🛠️ Technical Stack

* **Framework:** Next.js 16.1.1 (App Router) & React 19.2.3.
* **Styling:** Tailwind CSS 4 with custom design system.
* **Backend:** Supabase (Auth, PostgreSQL, Realtime).
* **AI Engine:** Groq SDK (Llama-3.3-70b-versatile).
* **Validation:** Zod 4.2.1 for strict schema validation.

## 🛡️ Security Implementation

Aura AI is built with a **Security-First** approach:
* **Data Isolation:** Strict **Row Level Security (RLS)** policies ensure users only access their own data.
* **API Protection:** Custom rate limiting for AI endpoints (20 req/min for chat, 10 req/min for tasks).
* **Hardened Headers:** Comprehensive security headers including CSP, HSTS, and X-XSS-Protection.
* **Input Validation:** Every user input is sanitized and validated via Zod schemas.
