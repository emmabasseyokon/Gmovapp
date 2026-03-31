-- Fix: weekly_scores view was implicitly SECURITY DEFINER (Supabase default).
-- Recreate it as SECURITY INVOKER so it runs with the querying user's permissions
-- and respects Row Level Security policies.

DROP VIEW IF EXISTS public.weekly_scores;

CREATE VIEW public.weekly_scores
  WITH (security_invoker = true)
AS
SELECT
  s.week_id,
  w.label   AS week_label,
  w.start_date,
  s.member_id,
  p.full_name,
  SUM(s.points) AS total_points,
  RANK() OVER (PARTITION BY s.week_id ORDER BY SUM(s.points) DESC) AS rank
FROM public.submissions s
JOIN public.profiles p ON p.id = s.member_id
JOIN public.weeks w ON w.id = s.week_id
GROUP BY s.week_id, w.label, w.start_date, s.member_id, p.full_name;
