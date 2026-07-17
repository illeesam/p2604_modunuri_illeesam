package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveProd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PmSaveProdRepository extends JpaRepository<PmSaveProd, PmSaveProd.PK> {

    /** 특정 적립금의 전개 행 전체 삭제 (재계산 전 초기화용) */
    @Modifying
    @Query("DELETE FROM PmSaveProd p WHERE p.saveId IN :saveIds")
    int deleteAllBySaveIds(@Param("saveIds") List<String> saveIds);

    /** 상품에 적용 가능한 활성 적립금 목록 조회 (FO 상품상세/주문 페이지용) */
    @Query("SELECT p.saveId FROM PmSaveProd p WHERE p.prodId = :prodId AND p.siteId = :siteId")
    List<String> findSaveIdsByProdId(@Param("prodId") String prodId, @Param("siteId") String siteId);
}
