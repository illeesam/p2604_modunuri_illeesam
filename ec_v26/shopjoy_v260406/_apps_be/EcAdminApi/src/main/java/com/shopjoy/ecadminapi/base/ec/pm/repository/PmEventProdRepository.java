package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventProd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PmEventProdRepository extends JpaRepository<PmEventProd, PmEventProd.PK> {

    /** 특정 이벤트의 전개 행 전체 삭제 (재계산 전 초기화용) */
    @Modifying
    @Query("DELETE FROM PmEventProd p WHERE p.eventId IN :eventIds")
    int deleteAllByEventIds(@Param("eventIds") List<String> eventIds);

    /** 상품에 적용 가능한 활성 이벤트 목록 조회 (FO 상품상세/주문 페이지용) */
    @Query("SELECT p.eventId FROM PmEventProd p WHERE p.prodId = :prodId AND p.siteId = :siteId")
    List<String> findEventIdsByProdId(@Param("prodId") String prodId, @Param("siteId") String siteId);
}
