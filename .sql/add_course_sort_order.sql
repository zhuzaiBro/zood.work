-- 课程列表排序
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS rn
  FROM courses
)
UPDATE courses
SET sort_order = ordered.rn
FROM ordered
WHERE courses.id = ordered.id;

CREATE INDEX IF NOT EXISTS idx_courses_sort_order ON courses(sort_order);
