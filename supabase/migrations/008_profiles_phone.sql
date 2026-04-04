-- profiles 테이블에 전화번호 컬럼 추가 (카카오 알림톡 발송용)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
