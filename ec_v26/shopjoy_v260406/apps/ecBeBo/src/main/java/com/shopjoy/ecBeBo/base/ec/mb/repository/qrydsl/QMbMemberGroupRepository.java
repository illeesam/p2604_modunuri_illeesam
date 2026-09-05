package com.shopjoy.ecBeBo.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMemberGroup;

import java.util.List;
import java.util.Optional;

/** MbMemberGroup QueryDSL Custom Repository */
public interface QMbMemberGroupRepository {

    Optional<MbMemberGroupDto.Item> selectById(String memberGroupId);

    List<MbMemberGroupDto.Item> selectList(MbMemberGroupDto.Request search);

    BasePage<MbMemberGroupDto.Item> selectPageData(MbMemberGroupDto.Request search);

    int updateSelective(MbMemberGroup entity);
}
