CREATE TABLE public.assistance_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
 phone text NOT NULL CHECK (phone ~ '^([+]91[ ]?)?[6-9][0-9]{9}$'),
 village text NOT NULL CHECK (char_length(village) BETWEEN 2 AND 120),
 assistance_type text NOT NULL CHECK (assistance_type IN ('Free camp','Medicines','Doctor consultation','Ambulance','Government schemes')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.assistance_requests TO anon, authenticated;
GRANT ALL ON public.assistance_requests TO service_role;
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors can submit assistance requests" ON public.assistance_requests FOR INSERT TO anon, authenticated WITH CHECK (true);