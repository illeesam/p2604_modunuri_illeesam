package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyhExtTestLog;

import java.util.List;

/**
 * SyhExtTestLog QueryDSL Custom Repository.
 *
 * <p>채널별 최신 이력 조회(상관 서브쿼리)만 QueryDSL 로 남긴다 — 나머지 단순 페이지 조회는
 * base 의 Spring Data 파생 쿼리(findByChannelKey / findAllByOrderByRegDateDesc)로 되돌렸다 (2026-08-27).</p>
 */
public interface QSyhExtTestLogRepository {

    /** 채널별 최신 이력 1건씩 (연동결과 초기값용, 채널당 regDate 최대값 상관 서브쿼리).
     *  base 의 findLatestByChannel 대체 (2026-08-27) */
    List<SyhExtTestLog> selectLatestByChannel();
}
