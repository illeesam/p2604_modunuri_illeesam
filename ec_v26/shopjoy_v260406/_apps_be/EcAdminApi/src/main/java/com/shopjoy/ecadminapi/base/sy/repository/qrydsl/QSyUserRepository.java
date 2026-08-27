package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** SyUser QueryDSL Custom Repository */
public interface QSyUserRepository {

    /** 단건 조회 */
    Optional<SyUserDto.Item> selectById(String userId);

    /** UNIQUE(login_id) 단건 조회 — 관리 엔티티 그대로 반환(로그인 후 실패횟수/최근로그인 등 dirty-checking 저장 필요, DTO selectById 와 다른 반환타입).
     *  co.auth 서비스의 raw EntityManager JPQL 대체 (2026-08-27) */
    Optional<SyUser> selectByLoginId(String loginId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<SyUserDto.Item> selectList(SyUserDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    BasePage<SyUserDto.Item> selectPageData(SyUserDto.Request search);

    /** 검색조건 기준 전체 카운트 (스트리밍 export 시 안전 상한 검증용) */
    long selectCount(SyUserDto.Request search);

    int updateSelective(SyUser entity);

    /** 부서 트리 노드별 SyUser 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 dept 행 포함. */
    List<Map<String, Object>> selectDeptTreeUserCnts(SyUserDto.Request search);
}