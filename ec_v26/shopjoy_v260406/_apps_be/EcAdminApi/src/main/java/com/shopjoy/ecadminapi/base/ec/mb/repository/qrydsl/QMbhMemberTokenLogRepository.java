package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;

import java.util.List;
import java.util.Optional;

/** MbhMemberTokenLog QueryDSL Custom Repository */
public interface QMbhMemberTokenLogRepository {

    Optional<MbhMemberTokenLogDto.Item> selectById(String logId);

    /** (authId, accessToken) 복합 UNIQUE 단건 조회 — 관리 엔티티 그대로 반환(토큰 갱신 시 dirty-checking 저장 필요, DTO selectById 와 다른 반환타입).
     *  co.auth.FoAuthService 의 raw EntityManager JPQL 대체 (2026-08-27) */
    Optional<MbhMemberTokenLog> selectByAuthIdAndAccessToken(String authId, String accessToken);

    List<MbhMemberTokenLogDto.Item> selectList(MbhMemberTokenLogDto.Request search);

    BasePage<MbhMemberTokenLogDto.Item> selectPageData(MbhMemberTokenLogDto.Request search);

    int updateSelective(MbhMemberTokenLog entity);
}
