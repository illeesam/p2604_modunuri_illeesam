package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;

import java.util.List;
import java.util.Optional;

/** MbMemberGrade QueryDSL Custom Repository */
public interface QMbMemberGradeRepository {

    Optional<MbMemberGradeDto.Item> selectById(String memberGradeId);

    List<MbMemberGradeDto.Item> selectList(MbMemberGradeDto.Request search);

    MbMemberGradeDto.PageResponse selectPageList(MbMemberGradeDto.Request search);

    int updateSelective(MbMemberGrade entity);
}
