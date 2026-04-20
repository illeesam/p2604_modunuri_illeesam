-- sy_template 브랜드명 변경: 아이디룩몰 → ShopJoy, 뚝딱 → ShopJoy
SET search_path TO shopjoy_2604;

UPDATE sy_template SET template_subject = REPLACE(template_subject, '아이디룩몰', 'ShopJoy') WHERE template_subject LIKE '%아이디룩몰%';
UPDATE sy_template SET template_subject = REPLACE(template_subject, '아이디룩', 'ShopJoy') WHERE template_subject LIKE '%아이디룩%';
UPDATE sy_template SET template_subject = REPLACE(template_subject, '뚝딱', 'ShopJoy') WHERE template_subject LIKE '%뚝딱%';

UPDATE sy_template SET template_content = REPLACE(template_content, '아이디룩몰', 'ShopJoy') WHERE template_content LIKE '%아이디룩몰%';
UPDATE sy_template SET template_content = REPLACE(template_content, '아이디룩', 'ShopJoy') WHERE template_content LIKE '%아이디룩%';
UPDATE sy_template SET template_content = REPLACE(template_content, '뚝딱', 'ShopJoy') WHERE template_content LIKE '%뚝딱%';
