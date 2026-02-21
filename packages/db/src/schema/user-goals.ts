import { integer, pgEnum, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const goalTypeEnum = pgEnum('goal_type', ['book_count'])

export const userGoals = pgTable(
  'user_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    goalType: goalTypeEnum('goal_type').notNull().default('book_count'),
    target: integer('target').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One goal per user per year per type
    unique('user_goals_unique').on(t.userId, t.year, t.goalType),
  ]
)

export type UserGoal = typeof userGoals.$inferSelect
export type NewUserGoal = typeof userGoals.$inferInsert
