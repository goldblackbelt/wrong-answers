-- 错题本系统 - Supabase 数据库 Schema

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 错题表
CREATE TABLE IF NOT EXISTS wrong_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_content TEXT,
  question_image VARCHAR(500),
  standard_answer TEXT,
  user_answer TEXT,
  error_reason TEXT,
  knowledge_points TEXT[],
  exam_points JSONB,
  category VARCHAR(50),
  difficulty INTEGER DEFAULT 3,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  mastery_level INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  last_review_date TIMESTAMP WITH TIME ZONE,
  similar_questions UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 题目表
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT,
  image VARCHAR(500),
  answer TEXT,
  explanation TEXT,
  knowledge_points TEXT[],
  exam_points TEXT[],
  difficulty INTEGER DEFAULT 3,
  type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 掌握度记录表
CREATE TABLE IF NOT EXISTS mastery_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES wrong_questions(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0,
  attempt_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_attempt_date TIMESTAMP WITH TIME ZONE,
  history JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 复习计划表
CREATE TABLE IF NOT EXISTS review_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  questions UUID[],
  next_review_date TIMESTAMP WITH TIME ZONE,
  review_interval INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_category ON wrong_questions(category);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_upload_date ON wrong_questions(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_mastery_records_user_id ON mastery_records(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_records_question_id ON mastery_records(question_id);
CREATE INDEX IF NOT EXISTS idx_review_plans_user_id ON review_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_review_plans_next_review_date ON review_plans(next_review_date);

-- 启用行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_plans ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的数据
CREATE POLICY "Users can view their own data" ON users
  FOR ALL
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view their own wrong questions" ON wrong_questions
  FOR ALL
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own mastery records" ON mastery_records
  FOR ALL
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own review plans" ON review_plans
  FOR ALL
  USING (auth.uid()::text = user_id::text);

-- 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wrong_questions_updated_at BEFORE UPDATE ON wrong_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mastery_records_updated_at BEFORE UPDATE ON mastery_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_plans_updated_at BEFORE UPDATE ON review_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 数据库创建完成提示
SELECT '数据库表创建完成！';
