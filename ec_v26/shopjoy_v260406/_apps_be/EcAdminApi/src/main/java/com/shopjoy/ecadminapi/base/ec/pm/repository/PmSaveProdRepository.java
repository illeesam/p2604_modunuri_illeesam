package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveProd;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSaveProdRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/* findSaveIdsByProdId → QPmSaveProdRepository.selectSaveIdsByProdId 로 전환 (2026-08-27) */
public interface PmSaveProdRepository extends JpaRepository<PmSaveProd, String>, QPmSaveProdRepository {

    /** 특정 적립금의 전개 행 전체 삭제 (재계산 전 초기화용) */
    @Modifying
    @Query("DELETE FROM PmSaveProd p WHERE p.saveId IN :saveIds")
    int deleteAllBySaveIds(@Param("saveIds") List<String> saveIds);
}
