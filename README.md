# 🤖 BMM Dashboard — Bot Messenger Middleware Web Interface

[![React 19](https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)]()

A centralized, developer-centric Web Application Dashboard for the **Bot Messenger Middleware (BMM)** platform. BMM bridges and unifies multi-tenant bot communication across heterogeneous messenger protocols (**Telegram**, **Bale**, etc.), offering a single command center for messaging, mass broadcasting, channel linking, granular access control, and media attachment management.

---

## 🎯 Purpose & Philosophy

### 1. Why BMM Frontend?
Managing multiple chatbot deployments across disparate messenger ecosystems is typically fragmented, requiring individual bot tokens, disparate webhooks, and separate administration panels. **BMM (Bot Messenger Middleware)** centralizes this workflow:
- **Universal Multi-Messenger Operations:** Unifies incoming and outgoing bot interactions across Telegram and Bale into a singular, normalized conversation stream.
- **Enterprise Multi-Tenancy & Access Control:** Empowers companies to link chats, invite administrators with granular role permissions (`super-admin` / `admin`), and control sensitive broadcast capabilities.
- **Unified Media & Delivery Engine:** Bridges varying messenger file protocols through an asynchronous attachment handling pipeline and secure presigned download links.

### 2. "Coding Vibe" & Chatbot-Inspired Aesthetics
The BMM UI deliberately adopts a **"Coding Vibe" / Hacker Dashboard** visual language inspired by modern AI chatbot consoles (ChatGPT, Claude, Cursor) and terminal-driven developer environments:
- **Clean Information Density:** High-contrast surfaces, subtle monochromatic borders (`border-border`), and compact, data-rich layouts designed for operational productivity rather than unnecessary animations.
- **Chatbot & Desktop Messenger Paradigm:** Emulates the split-pane workflow of Telegram Web and modern chat assistants—instant chat switching, real-time message composer, inline attachment previews, and contextual actions.
- **Monospace Elements & Status Chips:** Identifiers, IDs, timestamps, linking codes, and platform badges are styled with sharp, monospace typography and distinct status indicators.
- **Dual Themes & Bi-Directional Layouts:** First-class Dark Mode and tuned high-contrast Light Mode, with seamless one-click flipping between English (LTR) and Persian (RTL).

### 3. Functional First & HTTP-Only Polling
- **100% CRUD Coverage:** Every entity (Users, Company, Linked Chats, Broadcasts, Attachments) is equipped with full Create, Read, Update, and Delete operations.
- **HTTP-Only Synchronization (No WebSockets):** Since real-time WebSocket streams are unavailable on the backend, the frontend utilizes an intelligent, configurable HTTP REST polling engine (2s, 4s, 10s, 30s, 1m, or Off) paired with manual refetch triggers and smart cache reconciliation.

---

## 🚀 Key Modules & Architectural Highlights

### 💬 1. Real Chat Interface (Split-Pane Messenger)
- **Left Panel (Chat List):**
  - **Platform Badges:** Crisp visual distinction between **Telegram** and **Bale** chats with platform-native color schemes.
  - **Dynamic Last-Message Snippet:** Displays the latest message content, media indicators (📷 Photo, 🎥 Video, 🎵 Audio, 📁 Document), sender identity, and relative timestamps.
  - **Local Unread / Seen Tracking:** Client-side persistent cache (`localStorage`) that calculates and tags unread incoming messages per chat with Telegram-style badge counters. Selecting a chat automatically marks its messages as seen.
  - **Real-Time Search & Status Filters:** Filter linked chats by platform or title instantly.
- **Right Panel (Active Chat Window):**
  - **Grouped Multi-Attachment Cards:** Broadcast messages containing multiple attachments are rendered as a cohesive single message card with a unified caption, preserving messenger-native grouping aesthetics.
  - **Contextual Actions (Right-Click Context Menu):** Right-click on any broadcasted/outgoing message to edit the caption or permanently delete the broadcast message across channels.
  - **Batch Selection Mode:** Toggle multi-select mode to select several messages simultaneously and execute bulk deletions.
  - **Telegram-Style Floating Scroll Button:** Circular floating button with downward chevron that automatically appears when scrolled up and smoothly snaps to the latest messages when clicked.
- **Message Composer:**
  - Fast text messaging with Markdown formatting.
  - Reply support and inline caption editing.
  - **Strict Single-Type Media Upload:** Enforces messenger bot API constraints preventing cross-mixing of different media types in a single broadcast (e.g. photos cannot be mixed with documents or videos). Provides instant validation and preview thumbnails.

### 🔐 2. Granular RBAC Engine (Role-Based Access Control)
- **Unified UI Architecture:** Zero duplicated pages or layouts for `super-admin` vs `admin`. Both roles share identical screens while component-level guards dynamically adapt.
- **Declarative Permissions (`PermissionGuard` & `usePermission`):** Action buttons, edit modals, deletion triggers, and sensitive navigation links are conditionally rendered or disabled based on the user's permission matrix.
- **Roles:**
  - `super-admin`: Full governance over company profile, company users, chat unlinking, role delegation, broadcasts, and attachments.
  - `admin`: Operational access to active chats, messaging, and attachment exploration, with restricted administrative modification rights.

### 📢 3. Mass Broadcast Hub
- Multi-chat broadcast wizard capable of dispatching announcements and media across all linked channels and groups simultaneously.
- Broadcast audit logs with delivery telemetry (Sent, Pending, Failed counters per chat).
- Post-broadcast operations: edit message captions or delete dispatched messages across all linked targets.

### 📁 4. Centralized Attachments Gallery
- Unified repository of all files transferred through bot channels.
- Filterable by MIME type: **Photos**, **Videos**, **Audios**, and **Documents**.
- Dynamic resolution of secure, presigned download URLs.
- Metadata inspector showing file size, content type, uploaded timestamp, and source message reference.

### 👥 5. User & Company Governance
- **User Management:** Paginated and searchable user list, invite generation with customizable roles, account status toggling, and access revocation.
- **Company Settings:** View and update company registration metadata, notification thresholds, and linked bot configurations.
- **Profile Management:** View logged-in credentials, update personal details (`firstname`, `lastname`), and execute pre-verified email/phone update flows.

### 🔗 6. Linked Chats & Multi-Channel Onboarding
Supports three distinct bot linking mechanisms:
1. **Bot Token Direct Connect:** Connect channels directly via bot credentials.
2. **Deep Link Authentication:** Quick-launch linking through pre-generated bot deeplinks.
3. **Invite Code Handshake:** Link channels using secure one-time company invite codes.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Core UI component engine |
| **TypeScript 6** | Strict static type safety across API schemas and components |
| **Vite 8** | Next-generation build tool and lightning-fast HMR dev server |
| **Tailwind CSS v4** | CSS-variable-based tokenized design system with dark/light themes |
| **Axios** | HTTP client with automatic 401 JWT refresh interceptor |
| **Lucide React** | Consistent, developer-centric icon set |
| **Oxlint** | High-performance Rust-based JavaScript/TypeScript linter |
| **Nginx (Alpine)** | Lightweight production static web server and API reverse proxy |
| **Docker & Docker Compose** | Multi-stage containerization for seamless deployment |

---

## 📂 Project Structure

```
BMM--Bot-Messenger-Middleware--Frontend/
├── .env.example              # Environment variables template
├── Dockerfile                # Multi-stage production Docker build
├── docker-compose.yml        # Docker compose service definition
├── nginx.conf                # Nginx SPA fallback & API reverse-proxy configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript project references
├── vite.config.ts            # Vite bundler configuration
├── public/                   # Static public assets (favicons, SVG icons)
└── src/
    ├── api/                  # Axios HTTP client, endpoint definitions & interceptors
    │   ├── attachments.ts    # File gallery & presigned URL endpoints
    │   ├── auth.ts           # Authentication & session refresh endpoints
    │   ├── broadcasts.ts     # Broadcast management & history endpoints
    │   ├── chats.ts          # Linked chats & chat history endpoints
    │   ├── client.ts         # Base Axios instance with Bearer token interceptor
    │   ├── company.ts        # Company settings endpoints
    │   ├── linking.ts        # Bot token, deep link & invite code endpoints
    │   └── users.ts          # User CRUD & profile update endpoints
    ├── components/           # Modular React components
    │   ├── chat/             # ChatList, ChatWindow, MessageComposer, MessageItem, etc.
    │   ├── common/           # Button, Input, Modal, Badge, PlatformBadge, ThemeToggle, etc.
    │   ├── layout/           # AppLayout, Header (sync polling selector), Sidebar
    │   ├── linking/          # ChatLinkingModal (3 linking methods)
    │   └── users/            # UserListTable, InviteUserModal, EditUserModal
    ├── contexts/             # Global React Context providers
    │   ├── AuthContext.tsx   # User session, JWT tokens, login/logout state
    │   ├── LanguageContext.tsx # EN/FA language switching and RTL/LTR direction
    │   ├── ThemeContext.tsx  # Dark / Light mode switching
    │   └── ToastContext.tsx  # Global notification toast system
    ├── i18n/                 # Localization dictionaries (English & Persian)
    ├── pages/                # Top-level application pages & views
    │   ├── AttachmentsPage.tsx
    │   ├── BroadcastsPage.tsx
    │   ├── CompanyPage.tsx
    │   ├── LinkedChatsPage.tsx
    │   ├── LoginPage.tsx
    │   ├── MessagingPage.tsx
    │   ├── ProfilePage.tsx
    │   ├── RegisterCompanyPage.tsx
    │   ├── RegisterInvitePage.tsx
    │   └── UsersPage.tsx
    ├── permissions/          # Granular RBAC system
    │   ├── PermissionGuard.tsx # Declarative UI wrapper for permission-gated elements
    │   ├── policyMatrix.ts   # Role-to-permission mapping rules
    │   └── usePermission.ts  # Custom hook for programmatic permission checks
    ├── types/                # Strongly-typed TypeScript interfaces
    └── utils/                # Date formatting, error helpers, file converters
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Docker & Docker Compose** *(for containerized deployment)*

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd BMM--Bot-Messenger-Middleware--Frontend
npm install
```

### 2. Environment Configuration
Create a local `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Default configuration:
```env
# Frontend API endpoint prefix (proxied to backend on port 15014)
VITE_API_URL=/api/v1
```

### 3. Local Development Server
Start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 4. Code Quality & Linting
Run the type-checker and fast linter:
```bash
# Type check with TypeScript compiler
npm run build

# Run Oxlint
npm run lint
```

---

## 🐳 Docker Deployment

The application includes a production-ready, multi-stage `Dockerfile` and `docker-compose.yml` configured with `nginx:alpine` to serve compiled assets and automatically reverse-proxy `/api/` calls to the BMM backend service.

### Quick Start with Docker Compose
```bash
# Build and launch the container in the background
docker-compose up --build -d

# Check container status
docker-compose ps

# View access and proxy logs
docker-compose logs -f frontend
```
The dashboard will be accessible at: `http://localhost:3000`.

### Nginx Proxy Architecture
In production, Nginx handles client-side SPA routing (`try_files $uri $uri/ /index.html;`) and forwards all `/api/` traffic directly to the host machine backend on port `15014` via `host.docker.internal`:
```nginx
location /api/ {
    proxy_pass http://host.docker.internal:15014/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 🔒 Authentication & Role Matrix

| Capability / Action | Super Admin (`super-admin`) | Admin (`admin`) |
| :--- | :---: | :---: |
| View Chats & Read Messages | ✅ | ✅ |
| Send Messages & Upload Attachments | ✅ | ✅ |
| Dispatch Broadcasts | ✅ | ✅ |
| Edit / Delete Outbound Broadcasts | ✅ | ✅ |
| View Attachments Gallery | ✅ | ✅ |
| Link New Messenger Chats | ✅ | ❌ |
| Unlink / Disconnect Chats | ✅ | ❌ |
| View Company Users | ✅ | ✅ |
| Invite New Users | ✅ | ❌ |
| Update User Roles & Status | ✅ | ❌ |
| Revoke User Access | ✅ | ❌ |
| Edit Company Settings | ✅ | ❌ |
| Edit Own Profile | ✅ | ✅ |

---

## 🌐 Internationalization (i18n)

The dashboard supports full bidirectional localization:
- **English (EN):** LTR orientation, standard developer terminology.
- **Persian (FA - فارسی):** Native RTL layout flipping, complete translation covering all modals, toasts, error messages, and table headers.

Toggle between languages at any time via the globe icon button in the top navigation bar.

---

## 📄 License
This project is proprietary software developed for the Bot Messenger Middleware (BMM) platform. All rights reserved.