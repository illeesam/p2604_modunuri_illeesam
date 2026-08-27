package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntProd;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntProdRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/* findDiscntIdsByProdId → QPmDiscntProdRepository.selectDiscntIdsByProdId 로 전환 (2026-08-27) */
public interface PmDiscntProdRepository extends JpaRepository<PmDiscntProd, String>, QPmDiscntProdRepository {

    /** 특정 할인의 전개 행 전체 삭제 (재계산 전 초기화용) */
    @Modifying
    @Query("DELETE FROM PmDiscntProd p WHERE p.discntId IN :discntIds")
    int deleteAllByDiscntIds(@Param("discntIds") List<String> discntIds);
}
