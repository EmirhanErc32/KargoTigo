-- AI analiz kotasini sifirla (5 hak geri gelir)
-- Kendi user id'nizi bulun: SELECT id, email FROM users WHERE email = 'emirhanercan032@gmail.com';

DELETE FROM public.api_query_log
WHERE user_id = (
  SELECT id FROM public.users WHERE email = 'emirhanercan032@gmail.com'
)
AND endpoint = 'ai-analyze';
