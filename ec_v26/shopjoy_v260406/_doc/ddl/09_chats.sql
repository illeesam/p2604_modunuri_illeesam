-- =====================================================
-- ShopJoy v2.6.0406 - chats 테이블
-- 설명: 사용자-관리자 간 채팅 메시지
-- =====================================================

CREATE TABLE IF NOT EXISTS chats (
  chat_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '채팅 ID',
  thread_id INT COMMENT '채팅 스레드 ID',
  user_id INT NOT NULL COMMENT '사용자 ID',
  admin_id INT COMMENT '관리자 ID (NULL이면 사용자)',
  message TEXT NOT NULL COMMENT '메시지 내용',
  message_type ENUM('TEXT', 'IMAGE', 'FILE') DEFAULT 'TEXT' COMMENT '메시지 타입',
  file_url VARCHAR(255) COMMENT '파일/이미지 URL',
  is_read BOOLEAN DEFAULT FALSE COMMENT '읽음 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  INDEX idx_user_id (user_id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_thread_id (thread_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자-관리자 간 채팅 메시지';
