package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;

import java.util.List;
import java.util.Optional;

/** SyRole QueryDSL Custom Repository */
public interface QSyRoleRepository {

    Optional<SyRoleDto.Item> selectById(String roleId);

    List<SyRoleDto.Item> selectList(SyRoleDto.Request search);

    BasePage<SyRoleDto.Item> selectPageData(SyRoleDto.Request search);

    /** 검색조건 기준 전체 카운트 (대량 export 안전 상한 검증용) */
    long selectCount(SyRoleDto.Request search);

    int updateSelective(SyRole entity);

    /** 루트 role + 모든 자손 role_id 수집(트리조회 §14.6.9 — QueryDSL 전체조회 + 자바 BFS) */
    List<String> selectTreeRoleIds(String rootRoleId);
}
