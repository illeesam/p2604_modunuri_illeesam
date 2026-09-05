package com.shopjoy.ecBeBo.base.ec.pm.repository;

import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmDiscnt;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmDiscntRepository;

import java.util.List;

public interface PmDiscntRepository extends JpaRepository<PmDiscnt, String>, QPmDiscntRepository {

    /** 상태 자동 동기화 배치 대상 */
    List<PmDiscnt> findByUseYnAndDiscntStatusCd(String useYn, String discntStatusCd);
}
