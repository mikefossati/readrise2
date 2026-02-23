# ReadRise iOS — Implementation Plan

**Created:** 2026-02-23
**Status:** In Progress
**Target:** iOS 17+, Swift 6, SwiftUI
**Repo:** github.com/mikefossati/readrise-ios

---

## 1. Scope

Feature parity with web Phase 1 (milestones 1.1–1.4) plus iOS-specific capabilities:

| Feature | Web | iOS |
|---------|-----|-----|
| Library management (add, shelves, search) | ✅ | ✅ |
| Progress logging | ✅ | ✅ |
| Session timer | ✅ | ✅ (background-aware) |
| Reading stats & streak | ✅ | ✅ |
| Annual reading goal | ✅ | ✅ |
| Goodreads CSV import | ✅ | ❌ (deferred — camera can't select files easily) |
| Barcode scan | ❌ | ✅ (iOS-only differentiator) |
| Rating & notes | ✅ | ✅ |
| Sign in with Apple | ❌ | ✅ (App Store required) |
| Google OAuth | ✅ | ✅ |
| Subscription UI | ✅ | ❌ (hidden — StoreKit 2 deferred to future phase) |

---

## 2. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | Swift 6 | Strict concurrency |
| UI | SwiftUI | iOS 17+ features (@Observable, NavigationStack) |
| Auth | supabase-swift 2.x | Shared sessions with web |
| API | URLSession + async/await | Custom APIClient, calls Next.js route handlers |
| Barcode | AVFoundation | AVCaptureMetadataOutput |
| Timer | Timestamp-based | Store startedAt in UserDefaults, compute elapsed on foreground |
| Keychain | supabase-swift built-in | Handles JWT storage automatically |
| Error tracking | Sentry for iOS | |

---

## 3. Architecture

```
ReadRise/
├── App/
│   ├── ReadRiseApp.swift        @main, Supabase init, onOpenURL for OAuth
│   └── RootView.swift           Auth gate: AuthView vs MainTabView
├── Environment.swift            API base URL, Supabase keys (build config)
├── Models/
│   └── Models.swift             All Codable structs matching API responses
├── Services/
│   ├── APIClient.swift          URLSession wrapper, injects Bearer token
│   ├── AuthService.swift        @Observable, wraps supabase.auth
│   └── TimerService.swift       @Observable, start/stop/background-aware timer
├── Features/
│   ├── Auth/
│   │   └── AuthView.swift       Apple Sign In + Google OAuth buttons
│   ├── Main/
│   │   └── MainTabView.swift    TabView: Dashboard, Library, Goals, Profile
│   ├── Dashboard/
│   │   ├── DashboardView.swift
│   │   └── DashboardViewModel.swift
│   ├── Library/
│   │   ├── LibraryView.swift    Now Reading band + shelf tabs
│   │   ├── LibraryViewModel.swift
│   │   ├── BookSearchView.swift
│   │   ├── BookSearchViewModel.swift
│   │   └── BarcodeScanView.swift  AVCaptureSession scanner
│   ├── BookDetail/
│   │   ├── BookDetailView.swift
│   │   └── BookDetailViewModel.swift
│   ├── Goals/
│   │   ├── GoalsView.swift
│   │   └── GoalsViewModel.swift
│   └── Profile/
│       └── ProfileView.swift    Display name + sign out
└── Resources/
    ├── Assets.xcassets
    ├── Info.plist
    └── ReadRise.entitlements
```

---

## 4. API Contract

The iOS app consumes the existing Next.js REST API. All requests require:
- `Authorization: Bearer {supabase_access_token}`
- `Content-Type: application/json` (for POST/PATCH)

| Endpoint | Method | iOS Usage |
|----------|--------|-----------|
| `/api/library` | GET | Fetch library by shelf |
| `/api/library` | POST | Add book (from search or barcode) |
| `/api/library/{id}` | GET | Book detail |
| `/api/library/{id}` | PATCH | Change shelf, dates |
| `/api/library/{id}/progress` | GET | Progress history |
| `/api/library/{id}/progress` | POST | Log progress |
| `/api/library/{id}/sessions` | GET | Session history |
| `/api/library/{id}/sessions` | POST | Start session |
| `/api/library/{id}/sessions/{sid}` | PATCH | End session |
| `/api/library/{id}/review` | GET | Fetch review |
| `/api/library/{id}/review` | PUT | Save review |
| `/api/books/search` | GET | `?q=` text search |
| `/api/books/search` | GET | `?q=isbn:...` barcode lookup |
| `/api/stats` | GET | Dashboard stats |
| `/api/goals` | GET | Goals for year |
| `/api/goals` | POST | Set/update goal |
| `/api/user/profile` | GET | Display name |
| `/api/user/profile` | PATCH | Update display name |
| `/api/user/onboarding` | POST | Mark onboarding complete |

---

## 5. Auth Flow

```
App launch
  └─ supabase.auth.authStateChanges listener
       ├─ .signedOut → AuthView
       │     ├─ [Sign in with Apple]
       │     │    └─ ASAuthorizationAppleIDProvider
       │     │         └─ supabase.auth.signInWithIdToken(provider: .apple)
       │     └─ [Continue with Google]
       │          └─ supabase.auth.signInWithOAuth(provider: .google, redirectTo: "readrise://auth-callback")
       │               └─ Opens ASWebAuthenticationSession
       │                    └─ onOpenURL → supabase.auth.session(from: url)
       └─ .signedIn → MainTabView
```

Apple Sign In is **required** for App Store submission whenever the app offers
third-party social login (App Store Review Guideline 4.8).

**Entitlement required:** `com.apple.developer.applesignin` (added to `ReadRise.entitlements`)

---

## 6. Background-Aware Session Timer

The reading timer must keep running when the user backgrounds the app (e.g., they stop reading, lock the phone, then come back later).

**Approach:** Timestamp-based (no BackgroundTasks framework needed)

```
startSession()
  → record startedAt = Date() in TimerService + UserDefaults
  → POST /api/library/{id}/sessions → get sessionId

App backgrounds (scenePhase == .background)
  → save elapsed seconds so far to UserDefaults

App returns to foreground (scenePhase == .active)
  → reload startedAt from UserDefaults
  → elapsed = Date() - startedAt
  → timer display updates immediately

endSession(pagesEnd:)
  → compute final duration = Date() - startedAt
  → PATCH /api/library/{id}/sessions/{sessionId} { pagesEnd }
  → clear UserDefaults
```

The server computes `durationSeconds` and `pagesPerHour` from `startedAt`/`endedAt` on the API side. The iOS timer is display-only.

---

## 7. Barcode Scanner

Uses `AVFoundation` directly (no third-party library needed for EAN-13/ISBN-13).

**Flow:**
1. User taps barcode icon in LibraryView
2. `BarcodeScanView` opens as sheet, starts `AVCaptureSession`
3. On scan, decode EAN-13 → ISBN-13 (they are the same format)
4. Call `/api/books/search?q=isbn:{code}` to look up the book
5. Present found book for confirmation (cover, title, author)
6. User taps "Add" → POST /api/library
7. Sheet dismisses, library refreshes

**Permissions:** `NSCameraUsageDescription` in Info.plist

---

## 8. Subscription Gating

- No pricing UI shown in iOS app
- If API returns `409 BOOK_LIMIT_REACHED`, show: "You've reached the 50-book limit. Visit readrise.app to upgrade."
- No StoreKit integration in this phase — IAP deferred to future

---

## 9. Implementation Milestones

### Milestone iOS-A — Project setup + Auth
- Xcode project (via `xcodegen generate`)
- supabase-swift package added
- Sign in with Apple + Google OAuth working
- Session persistence (Keychain via supabase-swift)
- `RootView` auth gate

### Milestone iOS-B — Library + Book Search + Barcode
- GET /api/library → shelf tabs + Now Reading band
- POST /api/library → book search sheet
- BarcodeScanView (AVFoundation)
- Book detail navigation

### Milestone iOS-C — Session Timer + Progress
- BookDetailView with parchment header
- TimerService (background-aware)
- POST /api/library/{id}/sessions → PATCH end session
- Progress logging form

### Milestone iOS-D — Dashboard + Goals + Profile
- DashboardView (streak hero, stat row, currently reading, recent sessions)
- GoalsView (progress + pace indicator)
- ProfileView (display name + sign out)

### Milestone iOS-E — QA + TestFlight
- Test on real device (barcode, background timer)
- Accessibility review
- App Store metadata + screenshots
- TestFlight closed beta

---

## 10. Xcode Setup (one-time)

```bash
# Install xcodegen if not present
brew install xcodegen

# Clone the iOS repo
git clone https://github.com/mikefossati/readrise-ios
cd readrise-ios

# Generate Xcode project from project.yml
xcodegen generate

# Open in Xcode
open ReadRise.xcodeproj
```

After opening:
1. Set **Team** in Signing & Capabilities (your Apple Developer account)
2. Set **Bundle Identifier** to match your App Store Connect app ID
3. The `supabase-swift` package resolves automatically on first build

**Environment:** Copy `ReadRise/Environment.swift.example` to `ReadRise/Environment.swift`
and fill in your Supabase URL + anon key. This file is `.gitignore`d.
