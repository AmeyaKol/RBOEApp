-- =============================================================================
-- PROJECT CONSTELLATION - DATABASE SCHEMA
-- =============================================================================
-- This file contains the complete database schema for the Project Constellation
-- application including user management, profiles, and application tracking.

-- =============================================================================
-- ENUMS
-- =============================================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('STUDENT', 'ADMIN');

-- Application status enum
CREATE TYPE application_status AS ENUM (
  'RESEARCHING', 
  'APPLYING', 
  'APPLIED', 
  'ACCEPTED', 
  'REJECTED', 
  'WAITLISTED'
);

-- Document type enum
CREATE TYPE document_type AS ENUM ('SOP', 'LOR', 'RESUME', 'TRANSCRIPT');

-- Request status enum
CREATE TYPE request_status AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- =============================================================================
-- TABLES
-- =============================================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'STUDENT',
  
  -- Academic information (for students)
  gre_score INTEGER CHECK (gre_score >= 260 AND gre_score <= 340),
  toefl_score INTEGER CHECK (toefl_score >= 0 AND toefl_score <= 120),
  undergrad_gpa DECIMAL(3,2) CHECK (undergrad_gpa >= 0.0 AND undergrad_gpa <= 10.0),
  work_experience_months INTEGER CHECK (work_experience_months >= 0),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Documents table for SOPs, LORs, etc.,
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  type document_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  version INTEGER DEFAULT 1 NOT NULL,
  is_master BOOLEAN DEFAULT false NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- University applications table
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  university_name TEXT NOT NULL,
  program_name TEXT,
  status application_status DEFAULT 'RESEARCHING' NOT NULL,
  deadline DATE,
  application_fee DECIMAL(10,2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Request system table for student-admin communication
CREATE TABLE requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status request_status DEFAULT 'OPEN' NOT NULL,
  is_urgent BOOLEAN DEFAULT false NOT NULL,
  urgent_reason TEXT,
  admin_response TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Comments table for document collaboration
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  position_start INTEGER,
  position_end INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Performance indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_documents_student_id ON documents(student_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_requests_student_id ON requests(student_id);
CREATE INDEX idx_requests_admin_id ON requests(admin_id);
CREATE INDEX idx_requests_document_id ON requests(document_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_comments_document_id ON comments(document_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES (OPTIMIZED FOR PERFORMANCE)
-- =============================================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all student profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (SELECT auth.uid()) AND role = 'ADMIN'
    )
  );

-- Documents policies
CREATE POLICY "Students can manage their own documents" ON documents
  FOR ALL USING (student_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage all student documents" ON documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (SELECT auth.uid()) AND role = 'ADMIN'
    )
  );

-- Applications policies
CREATE POLICY "Students can manage their own applications" ON applications
  FOR ALL USING (student_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all applications" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (SELECT auth.uid()) AND role = 'ADMIN'
    )
  );

-- Requests policies
CREATE POLICY "Students can manage their own requests" ON requests
  FOR ALL USING (student_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage all requests" ON requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (SELECT auth.uid()) AND role = 'ADMIN'
    )
  );

-- Comments policies
CREATE POLICY "Users can view comments on their documents" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_id 
      AND (documents.student_id = (SELECT auth.uid()) OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = (SELECT auth.uid()) AND role = 'ADMIN'
      ))
    )
  );

CREATE POLICY "Users can create comments on accessible documents" ON comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_id 
      AND (documents.student_id = (SELECT auth.uid()) OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = (SELECT auth.uid()) AND role = 'ADMIN'
      ))
    )
  );

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'STUDENT')::user_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- SAMPLE DATA (for development)
-- =============================================================================

-- Sample admin user (you'll need to create this user in Supabase Auth first)
-- INSERT INTO profiles (user_id, full_name, role) VALUES
--   ('your-admin-user-uuid-here', 'Admin User', 'ADMIN');

-- Sample student user (you'll need to create this user in Supabase Auth first)
-- INSERT INTO profiles (user_id, full_name, role, gre_score, toefl_score, undergrad_gpa) VALUES
--   ('your-student-user-uuid-here', 'John Doe', 'STUDENT', 325, 110, 3.8); 