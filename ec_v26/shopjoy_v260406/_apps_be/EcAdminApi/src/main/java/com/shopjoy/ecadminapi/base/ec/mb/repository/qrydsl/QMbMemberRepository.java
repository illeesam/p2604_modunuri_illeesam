package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;

import java.util.List;
import java.util.Optional;

/** MbMember QueryDSL Custom Repository */
public interface QMbMemberRepository {

    /** 단건 조회 */
    Optional<MbMemberDto.Item> selectById(String memberId);

    /** UNIQUE(login_id) 단건 조회 — 관리 엔티티 그대로 반환(로그인 후 lastLogin 등 dirty-checking 저장 필요, DTO selectById 와 다른 반환타입).
     *  base 의 findByLoginId 대체 */
    Optional<MbMember> selectByLoginId(String loginId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<MbMemberDto.Item> selectList(MbMemberDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    BasePage<MbMemberDto.Item> selectPageData(MbMemberDto.Request search);

    int updateSelective(MbMember entity);

    /** FO 로그인 화면 사이트 선택란 — 회원이 실제 등록된 사이트 목록. base 의 findDistinctSiteIds 대체 (2026-08-27) */
    List<String> selectDistinctSiteIds();

    /** 등급 재산정 대상 — ACTIVE 상태 전체 (mutate+save 필요, 관리 엔티티 그대로 반환).
     *  base 의 findActiveForGradeCalc 대체 (2026-08-27) */
    List<MbMember> selectActiveForGradeCalc();

    /** 휴면 예정 이메일 대상 — ACTIVE + lastLogin 이 warnThreshold~dormantThreshold 사이 (관리 엔티티 그대로 반환).
     *  base 의 findDormantWarnTargets 대체 (2026-08-27) */
    List<MbMember> selectDormantWarnTargets(java.time.LocalDateTime warnThreshold, java.time.LocalDateTime dormantThreshold);

    /** 휴면 전환 대상 — ACTIVE + (lastLogin 이전 또는 미로그인+가입일 이전, mutate+save 필요, 관리 엔티티 그대로 반환).
     *  base 의 findDormantTargets 대체 (2026-08-27) */
    List<MbMember> selectDormantTargets(java.time.LocalDateTime threshold);
}
