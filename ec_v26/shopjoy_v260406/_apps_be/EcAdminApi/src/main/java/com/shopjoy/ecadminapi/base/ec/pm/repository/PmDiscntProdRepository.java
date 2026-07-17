package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntProd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PmDiscntProdRepository extends JpaRepository<PmDiscntProd, PmDiscntProd.PK> {

    /** 특정 할인의 전개 행 전체 삭제 (재계산 전 초기화용) */
    @Modifying
    @Query("DELETE FROM PmDiscntProd p WHERE p.discntId IN :discntIds")
    int deleteAllByDiscntIds(@Param("discntIds") List<String> discntIds);

    /** 상품에 적용 가능한 활성 할인 목록 조회 (FO 상품상세/주문 페이지용) */
    @Query("SELECT p.discntId FROM PmDiscntProd p WHERE p.prodId = :prodId AND p.siteId = :siteId")
    List<String> findDiscntIdsByProdId(@Param("prodId") String prodId, @Param("siteId") String siteId);
}
