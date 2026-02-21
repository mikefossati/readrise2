# ReadRise — Data Model

**Last updated:** 2026-02-21
**Status:** Draft — subject to revision when tech stack is chosen

---

## Entities Overview

```
User
 ├── UserGoal (annual book count goal)
 ├── UserBook (join: user owns a book with shelf + metadata)
 │    ├── ReadingSession (timer sessions per read)
 │    ├── ProgressEntry (page/percent log entries)
 │    └── Review (rating + notes)
 └── ReadingStreak (computed or stored streak data)

Book (canonical, shared across users)
 ├── sourced from Google Books API
 └── cached locally after first fetch
```

---

## Entity Definitions

### User
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| email | string | Unique |
| display_name | string | |
| avatar_url | string | Optional |
| created_at | timestamp | |
| subscription_tier | enum | free / reader / bibliophile |
| subscription_status | enum | active / canceled / past_due |

---

### Book
Canonical book record. Shared across all users (not duplicated per user).

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| google_books_id | string | External ID, unique |
| isbn_10 | string | Optional |
| isbn_13 | string | Optional |
| title | string | |
| subtitle | string | Optional |
| authors | string[] | Array of author names |
| description | text | |
| cover_url | string | |
| page_count | integer | |
| genres | string[] | From Google Books categories |
| published_date | date | |
| publisher | string | |
| language | string | ISO 639-1 |
| created_at | timestamp | When first added to our DB |

---

### UserBook
Represents a user's relationship with a book. One per user per book (plus one per re-read).

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → User |
| book_id | uuid | FK → Book |
| shelf | enum | reading / want_to_read / finished / abandoned |
| format | enum | physical / ebook / audiobook |
| started_at | date | Optional |
| finished_at | date | Optional |
| abandoned_at | date | Optional |
| reread_number | integer | 0 = first read, 1 = first reread, etc. |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### ProgressEntry
A log entry of reading progress at a point in time.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| user_book_id | uuid | FK → UserBook |
| page | integer | Absolute page number |
| percent | float | 0.0–1.0, derived from page / page_count |
| logged_at | timestamp | |
| note | text | Optional quick note |

---

### ReadingSession
A timed reading session (timer start/stop or manually logged).

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| user_book_id | uuid | FK → UserBook |
| started_at | timestamp | |
| ended_at | timestamp | Null if session still active |
| duration_seconds | integer | Computed on end |
| pages_start | integer | Page at session start |
| pages_end | integer | Page at session end |
| pages_read | integer | Derived: pages_end - pages_start |
| pages_per_hour | float | Derived: (pages_read / duration_seconds) * 3600 |
| note | text | Optional |

---

### Review
One review per UserBook (updated in place, not versioned).

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| user_book_id | uuid | FK → UserBook, unique |
| rating | float | 1.0–5.0, 0.5 increments |
| body | text | Optional private notes |
| is_public | boolean | Default false (Phase 3) |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### UserGoal
Tracks a user's reading goal for a given year.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → User |
| year | integer | e.g. 2026 |
| goal_type | enum | book_count (only type in MVP) |
| target | integer | e.g. 40 |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### ReadingStreak *(computed, may be derived rather than stored)*
| Field | Type | Notes |
|-------|------|-------|
| user_id | uuid | FK → User |
| current_streak | integer | Days in a row with a reading session |
| longest_streak | integer | All-time best |
| last_active_date | date | Last date a session was logged |

---

## Key Relationships

```
User (1) ──< UserBook (N)        A user can have many books
Book (1) ──< UserBook (N)        A book can be on many users' shelves
UserBook (1) ──< ProgressEntry (N)   Multiple progress logs per read
UserBook (1) ──< ReadingSession (N)  Multiple sessions per read
UserBook (1) ──  Review (1)          One review per read (updated in place)
User (1) ──< UserGoal (N)        One goal per year (potentially multiple types later)
```

---

## Computed / Derived Stats (not stored, calculated at query time)

| Stat | Derived From |
|------|-------------|
| Books read this year | UserBook where shelf = finished AND finished_at in current year |
| Total pages read | Sum of pages_read across all ProgressEntry |
| Total hours read | Sum of duration_seconds across all ReadingSession / 3600 |
| Average reading speed | Weighted average of pages_per_hour across sessions |
| Genre breakdown | Group UserBook → Book.genres, count by genre |
| Current streak | ReadingSession grouped by date, consecutive days |

---

## Goodreads Import Mapping

| Goodreads Field | ReadRise Field |
|----------------|---------------|
| Title | Book.title (used for search) |
| ISBN13 | Book.isbn_13 |
| My Rating | Review.rating |
| Date Read | UserBook.finished_at |
| Date Added | UserBook.created_at |
| Bookshelves | UserBook.shelf (mapped) |
| My Review | Review.body |
| Read Count | UserBook.reread_number |

**Shelf mapping:**
| Goodreads Shelf | ReadRise Shelf |
|----------------|---------------|
| read | finished |
| currently-reading | reading |
| to-read | want_to_read |
| (custom shelves) | ignored in MVP |
