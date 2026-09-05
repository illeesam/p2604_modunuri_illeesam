package com.shopjoy.ecBeBo.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMemberGrade;

import java.util.List;
import java.util.Optional;

/** MbMemberGrade QueryDSL Custom Repository */
public interface QMbMemberGradeRepository {

    Optional<MbMemberGradeDto.Item> selectById(String memberGradeId);

    List<MbMemberGradeDto.Item> selectList(MbMemberGradeDto.Request search);

    BasePage<MbMemberGradeDto.Item> selectPageData(MbMemberGradeDto.Request search);

    int updateSelective(MbMemberGrade entity);
}
