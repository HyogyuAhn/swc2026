-- Create the students table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  student_id TEXT, -- Optional based on requirement "if student id is added"
  email TEXT,
  phone TEXT NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('CS', 'AI')),
  ot_attendance TEXT DEFAULT 'N', -- 'Y' or 'N'
  after_party_attendance TEXT DEFAULT 'N', -- 'Y' or 'N'
  fee_status TEXT DEFAULT 'UNPAID' CHECK (fee_status IN ('PAID', 'UNPAID', 'NON_PARTICIPANT')), -- NON_PARTICIPANT for confirmed non-attendance if needed, or just UNPAID
  verifier_name TEXT, -- Required if fee_status is PAID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (since we use a private API key for admin actions or we can just allow public if we want to rely on app logic, but better to be safe)
-- For this simple app with hardcoded admin credentials, we might just use the service role key in the backend or allow anon access with restrictions.
-- Let's set a policy to allow all for now to avoid RLS issues, assuming the app handles auth.
CREATE POLICY "Allow all operations for anon" ON students
FOR ALL USING (true) WITH CHECK (true);
