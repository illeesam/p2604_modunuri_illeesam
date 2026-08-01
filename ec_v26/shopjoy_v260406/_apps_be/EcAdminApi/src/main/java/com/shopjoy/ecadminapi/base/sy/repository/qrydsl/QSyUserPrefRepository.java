package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserPref;

import java.util.List;

/** SyUserPref QueryDSL Custom Repository */
public interface QSyUserPrefRepository {

    /** userId 기준 전체 개인화 설정 조회 */
    List<SyUserPref> selectAll(String userId);
}
