# Supabase database setup (Step 2)

Run these scripts **in order** in the Supabase dashboard.

## 1. Open SQL Editor

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your **matching-game** project
3. Left sidebar → **SQL Editor**
4. Click **New query**

## 2. Run schema (tables + security)

1. Open `001_schema.sql` in this folder (in your code editor)
2. Copy the **entire file**
3. Paste into the SQL Editor
4. Click **Run** (or Ctrl+Enter)

You should see **Success. No rows returned**.

### Verify in Table Editor

Left sidebar → **Table Editor**. You should see:

- `question_sets`
- `options`
- `scores`

(Tables are empty until step 3.)

## 3. Run seed (sample questions)

1. **New query** again
2. Copy all of `002_seed.sql`
3. Paste and **Run**

### Verify seed

**Table Editor → `question_sets`** → 3 rows  
**Table Editor → `options`** → 24 rows (pairs of A/B items)

Or run in SQL Editor:

```sql
select title from question_sets;
select count(*) from options;
```

## 4. Confirm from the app

Restart dev server if needed, then open [http://localhost:3000](http://localhost:3000).

Status should show **Supabase ready** with question set count.

## Schema overview

| Table | Purpose |
|-------|---------|
| `question_sets` | One matching puzzle (random pool) |
| `options` | Items in section A or B; `pair_id` links correct matches |
| `scores` | Player results for top 10 leaderboard |

## Re-running scripts

- **001_schema.sql** — only run **once** per project (will error if tables already exist)
- **002_seed.sql** — only run **once** (will error on duplicate IDs)

To reset in development: delete rows in Table Editor, or drop tables and run `001` again.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `relation already exists` | Schema already applied — skip to seed or verify tables |
| `duplicate key` on seed | Seed already applied — check Table Editor |
| App shows "tables not created" | Run `001_schema.sql` |
| App shows "run seed" | Run `002_seed.sql` |
