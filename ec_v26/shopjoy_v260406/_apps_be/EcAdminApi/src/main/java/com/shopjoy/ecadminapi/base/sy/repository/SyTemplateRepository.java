package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyTemplateRepository;

/* findFirstByTemplateCodeAndUseYn → QSyTemplateRepository.selectFirstByTemplateCodeAndUseYn 로 전환 (2026-08-27) */
public interface SyTemplateRepository extends JpaRepository<SyTemplate, String>, QSyTemplateRepository {
}
