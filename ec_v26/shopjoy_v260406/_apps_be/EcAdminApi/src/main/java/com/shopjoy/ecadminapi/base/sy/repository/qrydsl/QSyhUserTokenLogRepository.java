package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;

import java.util.List;
import java.util.Optional;

/** SyhUserTokenLog QueryDSL Custom Repository */
public interface QSyhUserTokenLogRepository {

    /** 단건 조회 */
    Optional<SyhUserTokenLogDto.Item> selectById(String id);

    /** (authId, accessToken) 복합 UNIQUE 단건 조회 — 관리 엔티티 그대로 반환(토큰 갱신 시 dirty-checking 저장 필요, DTO selectById 와 다른 반환타입).
     *  co.auth.BoAuthService 의 raw EntityManager JPQL 대체 (2026-08-27) */
    Optional<SyhUserTokenLog> selectByAuthIdAndAccessToken(String authId, String accessToken);

    /** 전체 목록 */
    List<SyhUserTokenLogDto.Item> selectList(SyhUserTokenLogDto.Request search);

    /** 페이지 목록 */
    BasePage<SyhUserTokenLogDto.Item> selectPageData(SyhUserTokenLogDto.Request search);

    int updateSelective(SyhUserTokenLog entity);
}
