# ReadRise — MVP Scope

**Last updated:** 2026-02-21
**Status:** Defined

---

## MVP North Star

> A user can import or build their library, track reading sessions, and see meaningful stats about their reading life.

The MVP loop must be smooth and satisfying:

```
Sign up
  → Import from Goodreads OR add first book manually
    → Start a reading session
      → Log progress
        → Finish book → rate it
          → See stats update
            → Set annual goal → see progress toward it
```

---

## What's In

### Auth & Account
- [ ] Email/password sign up and login
- [ ] Google OAuth
- [ ] Basic profile (display name, avatar)

### Library & Books
- [ ] Search and add books via Google Books API
- [ ] Barcode scan on iOS (camera-based ISBN lookup)
- [ ] 4 core shelves: Reading, Want to Read, Finished, Abandoned
- [ ] Manual start and finish date entry
- [ ] Book detail view (cover, author, description, page count, genre)

### Goodreads Import
- [ ] CSV import (Goodreads export format)
- [ ] Map Goodreads shelves to ReadRise shelves
- [ ] Preserve ratings, dates, and review text

### Progress Tracking
- [ ] Log progress by page number or percentage
- [ ] Progress history per book
- [ ] Mark book as Finished (auto-set finish date)
- [ ] Mark book as Abandoned
- [ ] Basic re-read support (start a new read of an existing book)

### Session Timer
- [ ] Start/stop reading session timer
- [ ] Log pages read during session
- [ ] Auto-calculate reading speed (pages/hour)
- [ ] Session list per book

### Ratings & Reviews
- [ ] 1–5 star rating on finished books
- [ ] Private review / notes field per book

### Stats Dashboard
- [ ] Books read this year (count)
- [ ] Total pages read (all time and this year)
- [ ] Total hours read (from sessions)
- [ ] Average reading speed (pages/hour)
- [ ] Genre breakdown (chart)
- [ ] Current reading streak (days)

### Goals
- [ ] Set annual book count goal
- [ ] Progress bar and pace indicator (on track / behind / ahead)

---

## What's Out (Phase 2+)

- Social profiles and following
- Friends challenges
- Author follow / new release alerts
- Recommendations engine
- Series tracking
- Year-in-Review shareable card
- Advanced goal types (pages/day, genre diversity, time-based)
- Android app
- Custom shelves and tags
- Push notification reminders (evaluate post-launch)
- Public reviews

---

## Priority Stack Rank

| Priority | Feature | Rationale |
|----------|---------|-----------|
| P0 | Auth | Gate to everything |
| P0 | Book search + add | Can't use the app without a library |
| P0 | Shelf management | Core organizing mechanic |
| P0 | Progress logging | Core daily action |
| P0 | Goodreads import | Removes #1 adoption blocker |
| P1 | Session timer | Key differentiator |
| P1 | Stats dashboard | The "aha" moment that retains users |
| P1 | Annual goal | Drives daily engagement |
| P1 | Rating + review | Completes the "finished a book" flow |
| P2 | iOS barcode scan | Nice to have, not blocking web launch |
| P2 | Re-read support | Edge case, but expected by readers |
| P3 | Monetization / paywall | Launch free, validate, gate later |

---

## Riskiest Assumptions to Validate

1. **Will Goodreads users migrate?** — Import must be frictionless
2. **Is the session timer actually used?** — Or do users prefer manual logging?
3. **Do stats create retention?** — Do users return to watch their numbers grow?
4. **Is privacy-first a real differentiator?** — Or do users want the social layer?

---

## MVP Definition of Done

- [ ] Critical user journey completes without errors on web
- [ ] Critical user journey completes without errors on iOS
- [ ] Goodreads CSV import works end-to-end
- [ ] Stats update in real-time after logging progress
- [ ] App is stable enough for a small closed beta (< 100 users)
