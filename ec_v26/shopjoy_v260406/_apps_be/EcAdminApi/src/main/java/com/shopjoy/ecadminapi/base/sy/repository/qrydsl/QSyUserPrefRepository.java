package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserPref;

import java.util.List;
import java.util.Optional;

/** SyUserPref QueryDSL Custom Repository */
public interface QSyUserPrefRepository {

    /** userId 기준 전체 개인화 설정 조회 */
    List<SyUserPref> selectAll(String userId);

    /** (userId, prefKey) 복합 UNIQUE 단건 조회 — base 의 findByUserIdAndPrefKey 대체 */
    Optional<SyUserPref> selectByUserIdAndPrefKey(String userId, String prefKey);
}
