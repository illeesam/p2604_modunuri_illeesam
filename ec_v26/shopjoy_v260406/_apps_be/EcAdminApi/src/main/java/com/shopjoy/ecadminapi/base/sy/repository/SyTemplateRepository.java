package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyTemplateRepository;

import java.util.Optional;


public interface SyTemplateRepository extends JpaRepository<SyTemplate, String>, QSyTemplateRepository {

    /** 사이트 + 템플릿코드 + 사용여부(Y) 로 단건 조회 (발송용). 동일 코드 다건이면 첫 건. */
    Optional<SyTemplate> findFirstBySiteIdAndTemplateCodeAndUseYn(String siteId, String templateCode, String useYn);
}
