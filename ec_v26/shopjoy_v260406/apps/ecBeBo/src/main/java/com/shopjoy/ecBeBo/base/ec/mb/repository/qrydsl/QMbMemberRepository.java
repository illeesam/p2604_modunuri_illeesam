package com.shopjoy.ecBeBo.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMember;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** MbMember QueryDSL Custom Repository */
public interface QMbMemberRepository {

    /** 단건 조회 */
    Optional<MbMemberDto.Item> selectById(String memberId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<MbMemberDto.Item> selectList(MbMemberDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    BasePage<MbMemberDto.Item> selectPageData(MbMemberDto.Request search);

    int updateSelective(MbMember entity);

    /** FO 로그인 화면 사이트 선택란 — 회원이 실제 등록된 사이트 목록 (단일컬럼 DISTINCT 투영) */
    List<String> selectDistinctSiteIds();

    /**
     * 휴면 전환 대상 조회 — ACTIVE 상태 + 마지막 로그인이 threshold 이전인 회원.
     * lastLogin IS NULL(가입 후 미로그인)인 경우도 regDate 기준으로 threshold 경과 시 대상에 포함.
     * AND 안에 OR 그룹이 있어 Query Method 로 표현 불가.
     */
    List<MbMember> selectDormantTargets(LocalDateTime threshold);

    /**
     * 휴면 예정 이메일 대상 조회 — ACTIVE 상태 + 마지막 로그인이 warnThreshold ~ dormantThreshold 사이인 회원.
     * 파라미터 3개 이상이라 QueryDSL 사용.
     */
    List<MbMember> selectDormantWarnTargets(String memberStatusCd, LocalDateTime warnThreshold, LocalDateTime dormantThreshold);
}
