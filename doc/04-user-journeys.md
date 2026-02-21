# ReadRise — User Journeys

**Last updated:** 2026-02-21
**Status:** Draft

---

## Journey 1: New User — Goodreads Migrator

The most important acquisition path. User is frustrated with Goodreads and wants to switch.

```
1. Lands on marketing page
2. Clicks "Import from Goodreads free"
3. Signs up with Google OAuth (minimal friction)
4. Prompted: "Export your Goodreads library" (with link + instructions)
5. Uploads Goodreads CSV
6. Reviews import summary: "312 books imported across 4 shelves"
7. Lands on Library — sees their books already there
8. Clicks into a book they're currently reading
9. Sets current page progress
10. Starts a reading session timer
11. Stops timer after a few minutes (testing it)
12. Sees reading speed calculated automatically
13. Navigates to Stats — sees books read this year, pages, speed
14. Sets annual goal (e.g. 40 books)
15. Sees progress bar: "12 of 40 books — on pace"
→ Core value delivered. User is retained.
```

**Critical drop-off points:**
- Step 4: Instructions must be simple. Link directly to Goodreads export page.
- Step 6: Import must be fast and show clear feedback.
- Step 13: Stats must feel meaningful immediately (pre-populated from import data).

---

## Journey 2: New User — Starting Fresh

User hasn't used Goodreads. Building their library from scratch.

```
1. Signs up with email/password
2. Onboarding: "Add your first book"
3. Searches for a book by title
4. Adds it to "Currently Reading"
5. Sets starting page (e.g. "I'm already on page 47")
6. Taps "Start Reading Session"
7. Reads for a bit, stops timer
8. Logs pages read during session
9. Sees progress bar update on book detail
10. Finishes book over several sessions
11. Taps "Mark as Finished"
12. Prompted to rate and review
13. Rates 4 stars, writes a quick note
14. Stats dashboard updates: 1 book finished, X pages, X hours
15. Sets annual goal
→ Habit loop established.
```

**Critical drop-off points:**
- Step 3: Book search must return relevant results fast.
- Step 7: Timer UX must be dead simple — one tap to start, one to stop.

---

## Journey 3: Returning User — Daily Reading Check-in

User returns to the app on day 3 of their reading habit.

```
1. Opens app (web or iOS)
2. Sees home dashboard: current streak, today's session time, current book progress
3. Taps current book
4. Starts reading session
5. Reads for 45 minutes
6. Stops session — logs pages 187 → 224
7. Speed shown: 82 pages/hour
8. Progress bar: 68% complete
9. Returns to dashboard — streak updated, daily time logged
10. Checks annual goal — still on pace
→ Habit reinforced.
```

---

## Journey 4: Finishing a Book

```
1. User is on page 298 of 312 (a 95% progress)
2. Logs final session
3. Taps "Mark as Finished"
4. Prompted: rate this book (1–5 stars)
5. Optionally writes a review/note
6. Book moves to "Finished" shelf
7. Stats update: +1 book, +X pages, +X hours
8. If annual goal: progress bar animates
9. Prompt: "What do you want to read next?" — shows Want to Read shelf
→ Triggers next book selection, keeps user in loop.
```

---

## Journey 5: iOS Barcode Scan (Discovering a New Book)

User is in a bookstore and finds a book they want to read later.

```
1. Opens ReadRise iOS app
2. Taps "+" to add book
3. Taps "Scan barcode"
4. Points camera at book's ISBN barcode
5. Book found instantly — cover, title, author shown
6. Taps "Add to Want to Read"
7. Book saved
→ Frictionless wishlist capture in the real world.
```

---

## Journey 6: Viewing Stats

User wants to understand their reading year so far.

```
1. Taps Stats in nav
2. Sees: 18 books read this year, 4,820 pages, 62 hours
3. Average speed: 78 pages/hour
4. Current streak: 12 days
5. Genre chart: 40% fiction, 30% non-fiction, 20% biography, 10% sci-fi
6. Scrolls to reading speed trend: has improved from 65 to 78 over 3 months
7. Annual goal: 18 of 30 books — 2 ahead of pace
→ User feels accomplished. Motivated to continue.
```

---

## Edge Cases to Handle

| Scenario | Expected Behavior |
|----------|------------------|
| User starts session but forgets to stop timer | Show "Did you finish reading?" prompt after X hours of inactivity |
| User imports Goodreads CSV with unrecognized books | Skip unmatched, show summary of what was and wasn't imported |
| User marks a book as Abandoned | Book moves to Abandoned shelf; not counted toward goals; can be restarted later |
| User wants to re-read a finished book | "Start re-read" option on finished books; tracks as separate read instance |
| User logs progress backward (typo) | Warn but allow; do not block |
| Duplicate books in Goodreads import | Detect by ISBN, skip duplicates, notify user |
