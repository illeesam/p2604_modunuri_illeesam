-- ============================================================================
-- 마이그레이션: 고객센터 문의접수 알림 발송 시드 (MSG_CHANNEL 코드 + 템플릿 3종)
--
-- 목적: 문의 접수 완료 시 메일/카카오/시스템알림 발송에 필요한 기준 데이터
-- 대상: shopjoy_2604.sy_code, shopjoy_2604.sy_template
-- 일자: 2026-06-13
--
-- 내용:
--   1) sy_code MSG_CHANNEL 코드그룹 (syh_send_msg_log.channel_cd 표시용) — EMAIL/SMS/KAKAO/PUSH
--   2) sy_template CONTACT_RECEIVED_MAIL / _KAKAO / _ALARM 3종
--
-- 참고: 발송 채널별 이력 테이블은 이미 존재 (syh_send_email_log / syh_send_msg_log / syh_alarm_send_hist)
-- ============================================================================

BEGIN;

-- 1) MSG_CHANNEL 코드그룹 (없을 때만)
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,parent_code_value,child_code_values,code_remark,reg_by,reg_date,upd_by,upd_date)
SELECT 'CD001076','2604010000000001','MSG_CHANNEL','EMAIL','이메일',1,'Y',NULL,NULL,NULL,'SYSTEM',CURRENT_TIMESTAMP,NULL,NULL
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code WHERE code_grp='MSG_CHANNEL' AND code_value='EMAIL' AND site_id='2604010000000001');
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,parent_code_value,child_code_values,code_remark,reg_by,reg_date,upd_by,upd_date)
SELECT 'CD001077','2604010000000001','MSG_CHANNEL','SMS','SMS',2,'Y',NULL,NULL,NULL,'SYSTEM',CURRENT_TIMESTAMP,NULL,NULL
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code WHERE code_grp='MSG_CHANNEL' AND code_value='SMS' AND site_id='2604010000000001');
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,parent_code_value,child_code_values,code_remark,reg_by,reg_date,upd_by,upd_date)
SELECT 'CD001078','2604010000000001','MSG_CHANNEL','KAKAO','알림톡',3,'Y',NULL,NULL,'카카오 알림톡','SYSTEM',CURRENT_TIMESTAMP,NULL,NULL
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code WHERE code_grp='MSG_CHANNEL' AND code_value='KAKAO' AND site_id='2604010000000001');
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,parent_code_value,child_code_values,code_remark,reg_by,reg_date,upd_by,upd_date)
SELECT 'CD001079','2604010000000001','MSG_CHANNEL','PUSH','푸시',4,'Y',NULL,NULL,'앱 푸시 알림','SYSTEM',CURRENT_TIMESTAMP,NULL,NULL
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code WHERE code_grp='MSG_CHANNEL' AND code_value='PUSH' AND site_id='2604010000000001');

-- 2) 문의접수 알림 템플릿 3종 (없을 때만)
INSERT INTO shopjoy_2604.sy_template (template_id,site_id,template_type_cd,template_code,template_nm,template_subject,template_content,sample_params,use_yn,reg_by,reg_date,upd_by,upd_date,path_id)
SELECT 'TP000129','2604010000000001','EMAIL','CONTACT_RECEIVED_MAIL','문의접수 완료 메일','[ShopJoy] 문의가 정상 접수되었습니다',
  '<div style="max-width:600px;margin:0 auto;font-family:''Malgun Gothic'',sans-serif;color:#333;"><h2 style="color:#111;">문의가 정상 접수되었습니다</h2><p>안녕하세요 <strong>{name}</strong>님,</p><p>고객님의 문의(<strong>{inquiryType}</strong>)가 정상적으로 접수되었습니다.<br>담당자가 확인 후 빠르게 답변드리겠습니다.</p><p style="color:#888;font-size:12px;">- 본 메일은 발신 전용입니다. -<br>ShopJoy 고객센터</p></div>',
  '{"name":"{name}","inquiryType":"{inquiryType}","email":"{email}","tel":"{tel}"}','Y','SYSTEM',CURRENT_TIMESTAMP,NULL,NULL,'template.메일'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_template WHERE template_code='CONTACT_RECEIVED_MAIL' AND site_id='2604010000000001');
INSERT INTO shopjoy_2604.sy_template (template_id,site_id,template_type_cd,template_code,template_nm,template_subject,template_content,sample_params,use_yn,reg_by,reg_date,upd_by,upd_date,path_id)
SELECT 'TP000130','2604010000000001','KAKAO','CONTACT_RECEIVED_KAKAO','문의접수 완료 알림톡','문의접수 완료',
  '[ShopJoy] {name}님, 문의가 정상 접수되었습니다.' || chr(10) || '문의유형: {inquiryType}' || chr(10) || '담당자가 확인 후 빠르게 답변드리겠습니다. 감사합니다.',
  '{"name":"{name}","inquiryType":"{inquiryType}","email":"{email}","tel":"{tel}"}','Y','SYSTEM',CURRENT_TIMESTAMP,NULL,NULL,'template.kakao알림톡'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_template WHERE template_code='CONTACT_RECEIVED_KAKAO' AND site_id='2604010000000001');
INSERT INTO shopjoy_2604.sy_template (template_id,site_id,template_type_cd,template_code,template_nm,template_subject,template_content,sample_params,use_yn,reg_by,reg_date,upd_by,upd_date,path_id)
SELECT 'TP000131','2604010000000001','EMAIL','CONTACT_RECEIVED_ALARM','문의접수 시스템알림','신규 문의 접수',
  '{name}님이 문의를 접수했습니다. (유형: {inquiryType}, 이메일: {email})',
  '{"name":"{name}","inquiryType":"{inquiryType}","email":"{email}","tel":"{tel}"}','Y','SYSTEM',CURRENT_TIMESTAMP,NULL,NULL,'template.시스템알림'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_template WHERE template_code='CONTACT_RECEIVED_ALARM' AND site_id='2604010000000001');

COMMIT;

-- 검증
-- SELECT code_value, code_label FROM shopjoy_2604.sy_code WHERE code_grp='MSG_CHANNEL' ORDER BY sort_ord;
-- SELECT template_code, template_type_cd FROM shopjoy_2604.sy_template WHERE template_code LIKE 'CONTACT_RECEIVED%';
