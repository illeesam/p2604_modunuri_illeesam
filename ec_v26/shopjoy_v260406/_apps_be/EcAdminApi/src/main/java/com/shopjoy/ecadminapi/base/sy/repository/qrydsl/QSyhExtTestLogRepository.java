package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhExtTestLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * SyhExtTestLog QueryDSL Custom Repository.
 *
 * <p>DTO 투영 화면(검색/페이징)이 없는 개발용 로그 테이블이라 baseSelColumnQuery 없이
 * 엔티티를 그대로 반환한다(PdProdStock 과 동일한 "단순 구조" 패턴). 페이지 조회만 프론트/컨트롤러가
 * 이미 Spring Data {@link Page}를 소비하고 있어 그 타입을 유지한다.</p>
 */
public interface QSyhExtTestLogRepository {

    /** 채널별 이력 페이지 조회 — regDate 내림차순. base 의 findByChannelKey 대체 (2026-08-27) */
    Page<SyhExtTestLog> selectByChannelKey(String channelKey, Pageable pageable);

    /** 전체 이력 페이지 조회 — regDate 내림차순. base 의 findAllOrderByRegDateDesc 대체 (2026-08-27) */
    Page<SyhExtTestLog> selectAllOrderByRegDateDesc(Pageable pageable);

    /** 채널별 최신 이력 1건씩 (연동결과 초기값용, 채널당 regDate 최대값 상관 서브쿼리).
     *  base 의 findLatestByChannel 대체 (2026-08-27) */
    List<SyhExtTestLog> selectLatestByChannel();
}
