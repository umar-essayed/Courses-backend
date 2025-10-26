-- Sinceides Platform Database Schema
-- Supabase PostgreSQL Schema
-- This file contains all the necessary tables and relationships for the platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE gender_enum AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE role_enum AS ENUM ('admin', 'instructor', 'student', 'hr', 'support');
CREATE TYPE level_enum AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE status_enum AS ENUM ('open', 'closed', 'pending');
CREATE TYPE challenge_type_enum AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE challenge_status_enum AS ENUM ('upcoming', 'active', 'ended');
CREATE TYPE exam_type_enum AS ENUM ('quiz', 'midterm', 'final');
CREATE TYPE question_type_enum AS ENUM ('multiple_choice', 'true_false', 'essay');
CREATE TYPE learning_style_enum AS ENUM ('visual', 'auditory', 'kinesthetic', 'reading_writing');
CREATE TYPE proficiency_level_enum AS ENUM ('novice', 'intermediate', 'advanced', 'expert');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    date_of_birth DATE,
    country VARCHAR(100),
    gender gender_enum DEFAULT 'Other',
    role role_enum NOT NULL DEFAULT 'student',
    profile_picture_url TEXT,
    enrolled_course_ids UUID[] DEFAULT '{}',
    is_blocked BOOLEAN DEFAULT FALSE,
    assigned_hr_id UUID REFERENCES users(id),
    challenge_submissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    intro_video_url TEXT,
    instructor_id UUID NOT NULL REFERENCES users(id),
    total_lessons INTEGER DEFAULT 0,
    category_id UUID NOT NULL REFERENCES categories(id),
    language VARCHAR(10) NOT NULL DEFAULT 'English',
    level level_enum NOT NULL,
    student_ids UUID[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    first_publish_date TIMESTAMP WITH TIME ZONE,
    price DECIMAL(10,2),
    duration INTEGER, -- in minutes
    rating DECIMAL(3,2) DEFAULT 0,
    enrollment_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Lessons table
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_number INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    instructor_id UUID NOT NULL REFERENCES users(id),
    duration_minutes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(course_id, lesson_number)
);

-- Exams table
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type exam_type_enum NOT NULL,
    duration_minutes INTEGER NOT NULL,
    passing_score INTEGER NOT NULL,
    questions JSONB NOT NULL,
    max_attempts INTEGER DEFAULT 3,
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Exam attempts table
CREATE TABLE exam_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    time_spent INTEGER NOT NULL, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Certificates table
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL,
    certificate_url TEXT NOT NULL,
    verification_code VARCHAR(50) UNIQUE NOT NULL,
    grade VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enrollments table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lessons_completed UUID[] DEFAULT '{}',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, course_id)
);

-- Support conversations table
CREATE TABLE support_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    support_id UUID REFERENCES users(id),
    status status_enum DEFAULT 'open',
    messages JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Roadmaps table
CREATE TABLE roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    intro_video_url TEXT NOT NULL,
    estimated_hours INTEGER NOT NULL,
    difficulty level_enum NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    course_ids UUID[] DEFAULT '{}',
    enrolled_user_ids UUID[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    instructor_id UUID NOT NULL REFERENCES users(id),
    objectives TEXT[] DEFAULT '{}',
    prerequisites TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Challenges table
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type challenge_type_enum NOT NULL,
    status challenge_status_enum NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    questions JSONB NOT NULL,
    total_points INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    participants UUID[] DEFAULT '{}',
    leaderboard JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Learning profiles table
CREATE TABLE learning_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    learning_style learning_style_enum NOT NULL,
    proficiency_level proficiency_level_enum NOT NULL,
    preferred_difficulty level_enum NOT NULL,
    daily_study_time INTEGER NOT NULL, -- in minutes
    strengths TEXT[] DEFAULT '{}',
    weaknesses TEXT[] DEFAULT '{}',
    last_active_time VARCHAR(10), -- time of day when user is most active
    progress_rate DECIMAL(5,2) DEFAULT 0, -- average progress per week
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Recommendations table
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_ids UUID[] DEFAULT '{}',
    roadmap_ids UUID[] DEFAULT '{}',
    challenge_ids UUID[] DEFAULT '{}',
    confidence_score DECIMAL(3,2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Learning paths table
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    estimated_completion DATE NOT NULL,
    courses JSONB NOT NULL, -- array of course objects with order, dates, status
    progress DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Engagement metrics table
CREATE TABLE engagement_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    total_time_spent INTEGER DEFAULT 0, -- in minutes
    video_completion_rate DECIMAL(5,2) DEFAULT 0,
    quiz_attempts INTEGER DEFAULT 0,
    discussion_participation INTEGER DEFAULT 0,
    resource_downloads INTEGER DEFAULT 0,
    last_engagement TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, course_id)
);

-- Adaptive content table
CREATE TABLE adaptive_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    difficulty_variants JSONB NOT NULL, -- array of difficulty variants
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Predictive analytics table
CREATE TABLE predictive_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completion_probability DECIMAL(3,2) NOT NULL,
    predicted_grade VARCHAR(10) NOT NULL,
    risk_factors TEXT[] DEFAULT '{}',
    recommended_interventions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, course_id)
);

-- Study groups table
CREATE TABLE study_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    member_ids UUID[] DEFAULT '{}',
    meeting_schedule JSONB NOT NULL, -- day, time, frequency
    shared_resources TEXT[] DEFAULT '{}',
    discussion_threads JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Peer reviews table
CREATE TABLE peer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    criteria JSONB NOT NULL, -- array of criteria with scores and feedback
    overall_score DECIMAL(3,2) NOT NULL,
    overall_feedback TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Notification preferences table
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_types JSONB NOT NULL, -- array of notification type objects
    quiet_hours JSONB NOT NULL, -- start and end times
    weekly_digest BOOLEAN DEFAULT TRUE,
    activity_summary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_instructor ON courses(instructor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_category ON courses(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_published ON courses(is_published) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_course ON lessons(course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_enrollments_user ON enrollments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_enrollments_course ON enrollments(course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_exam_attempts_user ON exam_attempts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_exam_attempts_exam ON exam_attempts(exam_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_certificates_user ON certificates(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_certificates_course ON certificates(course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token) WHERE deleted_at IS NULL;
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activity_logs_action ON activity_logs(action) WHERE deleted_at IS NULL;
CREATE INDEX idx_roadmaps_category ON roadmaps(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_roadmaps_instructor ON roadmaps(instructor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_challenges_status ON challenges(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_challenges_type ON challenges(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_learning_profiles_user ON learning_profiles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recommendations_user ON recommendations(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_engagement_metrics_user ON engagement_metrics(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_predictive_analytics_user ON predictive_analytics(user_id) WHERE deleted_at IS NULL;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_attempts_updated_at BEFORE UPDATE ON exam_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_conversations_updated_at BEFORE UPDATE ON support_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refresh_tokens_updated_at BEFORE UPDATE ON refresh_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activity_logs_updated_at BEFORE UPDATE ON activity_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roadmaps_updated_at BEFORE UPDATE ON roadmaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_profiles_updated_at BEFORE UPDATE ON learning_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engagement_metrics_updated_at BEFORE UPDATE ON engagement_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_adaptive_content_updated_at BEFORE UPDATE ON adaptive_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictive_analytics_updated_at BEFORE UPDATE ON predictive_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON study_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_peer_reviews_updated_at BEFORE UPDATE ON peer_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Public courses are viewable by everyone
CREATE POLICY "Public courses are viewable" ON courses FOR SELECT USING (is_published = true AND deleted_at IS NULL);

-- Instructors can manage their own courses
CREATE POLICY "Instructors can manage own courses" ON courses FOR ALL USING (
    auth.uid()::text = instructor_id::text AND deleted_at IS NULL
);

-- Users can view lessons of enrolled courses
CREATE POLICY "Users can view enrolled course lessons" ON lessons FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM enrollments 
        WHERE user_id::text = auth.uid()::text 
        AND course_id = lessons.course_id 
        AND deleted_at IS NULL
    )
);

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create own enrollments" ON enrollments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own enrollments" ON enrollments FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can view their own exam attempts
CREATE POLICY "Users can view own exam attempts" ON exam_attempts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create own exam attempts" ON exam_attempts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can view their own certificates
CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can view their own support conversations
CREATE POLICY "Users can view own support conversations" ON support_conversations FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create own support conversations" ON support_conversations FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can view their own learning profiles
CREATE POLICY "Users can view own learning profiles" ON learning_profiles FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage own learning profiles" ON learning_profiles FOR ALL USING (auth.uid()::text = user_id::text);

-- Users can view their own recommendations
CREATE POLICY "Users can view own recommendations" ON recommendations FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can view their own engagement metrics
CREATE POLICY "Users can view own engagement metrics" ON engagement_metrics FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can view their own predictive analytics
CREATE POLICY "Users can view own predictive analytics" ON predictive_analytics FOR SELECT USING (auth.uid()::text = user_id::text);

-- Insert sample data
INSERT INTO categories (name, description) VALUES 
('Programming', 'Programming courses and tutorials'),
('Design', 'Design courses and tutorials'),
('Business', 'Business and entrepreneurship courses'),
('Marketing', 'Marketing and advertising courses'),
('Data Science', 'Data science and analytics courses');

-- Insert sample admin user (password: admin123)
INSERT INTO users (name, email, password_hash, phone_number, role) VALUES 
('Admin User', 'admin@sinceides.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzK.2K', '+1234567890', 'admin');

-- Insert sample instructor (password: instructor123)
INSERT INTO users (name, email, password_hash, phone_number, role) VALUES 
('John Instructor', 'instructor@sinceides.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzK.2K', '+1234567891', 'instructor');

-- Insert sample student (password: student123)
INSERT INTO users (name, email, password_hash, phone_number, role) VALUES 
('Jane Student', 'student@sinceides.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzK.2K', '+1234567892', 'student');

COMMIT;
