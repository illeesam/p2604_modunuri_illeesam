package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;

import java.util.List;
import java.util.Optional;

/** MbMemberGroup QueryDSL Custom Repository */
public interface QMbMemberGroupRepository {

    Optional<MbMemberGroupDto.Item> selectById(String memberGroupId);

    List<MbMemberGroupDto.Item> selectList(MbMemberGroupDto.Request search);

    MbMemberGroupDto.PageResponse selectPageList(MbMemberGroupDto.Request search);

    int updateSelective(MbMemberGroup entity);
}
