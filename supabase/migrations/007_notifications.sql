-- 알림 테이블
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  read       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 본인 알림만 읽기/수정 가능
CREATE POLICY "본인 알림 열람" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 알림 업데이트" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
