package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyTemplateRepository;

import java.util.Optional;

public interface SyTemplateRepository extends JpaRepository<SyTemplate, String>, QSyTemplateRepository {

    /** (templateCode, useYn=Y) 발송용 단건 조회 */
    Optional<SyTemplate> findFirstByTemplateCodeAndUseYn(String templateCode, String useYn);
}
