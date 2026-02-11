-- Deny anonymous access to profiles table
CREATE POLICY "deny_anon_access" ON public.profiles FOR ALL TO anon USING (false);

-- Deny anonymous access to customers table
CREATE POLICY "deny_anon_access" ON public.customers FOR ALL TO anon USING (false);