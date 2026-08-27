package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;

import java.util.List;
import java.util.Optional;

/** MbMemberGrade QueryDSL Custom Repository */
public interface QMbMemberGradeRepository {

    Optional<MbMemberGradeDto.Item> selectById(String memberGradeId);

    List<MbMemberGradeDto.Item> selectList(MbMemberGradeDto.Request search);

    BasePage<MbMemberGradeDto.Item> selectPageData(MbMemberGradeDto.Request search);

    int updateSelective(MbMemberGrade entity);

    /** 활성 등급 목록 — gradeRank 내림차순 (관리 엔티티 그대로 반환). base 의 findActiveOrderByRankDesc 대체 (2026-08-27) */
    List<MbMemberGrade> selectActiveOrderByRankDesc();
}
