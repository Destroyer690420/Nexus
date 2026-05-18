-- Fix existing resources that have subject NAME stored as subjectId instead of subject ID
-- This happens when the upload form used value={s.name} instead of value={s.id}
UPDATE public.resources r
SET "subjectId" = s.id
FROM public.subjects s
WHERE r."subjectId" = s.name
  AND r."courseId" = s."courseId"
  AND (r."branchId" = s."branchId" OR (r."branchId" IS NULL AND s."branchId" IS NULL))
  AND r."semesterId" = s."semesterId";

-- Fix existing contributions with the same issue
UPDATE public.contributions c
SET "subjectId" = s.id
FROM public.subjects s
WHERE c."subjectId" = s.name
  AND c."courseId" = s."courseId"
  AND (c."branchId" = s."branchId" OR (c."branchId" IS NULL AND s."branchId" IS NULL))
  AND c."semesterId" = s."semesterId";

-- Fix existing assignments with the same issue
UPDATE public.assignments a
SET "subjectId" = s.id
FROM public.subjects s
WHERE a."subjectId" = s.name
  AND a."courseId" = s."courseId"
  AND (a."branchId" = s."branchId" OR (a."branchId" IS NULL AND s."branchId" IS NULL))
  AND a."semesterId" = s."semesterId";
