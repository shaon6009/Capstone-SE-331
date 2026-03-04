
CREATE OR REPLACE FUNCTION public.generate_anon_name()
RETURNS TEXT 
LANGUAGE sql
STABLE 
SET search_path = public
AS $$
  SELECT 'Anon-' || substr(md5(random()::text), 1, 5);
$$;



