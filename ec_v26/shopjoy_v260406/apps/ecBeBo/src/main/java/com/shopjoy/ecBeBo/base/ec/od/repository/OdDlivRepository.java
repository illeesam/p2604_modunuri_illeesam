package com.shopjoy.ecBeBo.base.ec.od.repository;

import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdDliv;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdDlivRepository;

import java.time.LocalDateTime;
import java.util.List;

/* 주문 자동완료 대상 조회는 파라미터 3개 이상이라 QOdDlivRepository (QueryDSL) 사용 */
public interface OdDlivRepository extends JpaRepository<OdDliv, String>, QOdDlivRepository {

    /** 특정 배송상태이고 출고일시가 threshold 이전인 배송 목록 */
    List<OdDliv> findByDlivStatusCdAndDlivShipDateLessThanEqual(String dlivStatusCd, LocalDateTime threshold);

    /** 특정 배송상태인 배송 전체 목록 (스윗트래커 실시간 조회용) */
    List<OdDliv> findByDlivStatusCd(String dlivStatusCd);
}
