package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;

import java.util.List;
import java.util.Optional;

/** MbMemberRole QueryDSL Custom Repository */
public interface QMbMemberRoleRepository {

    Optional<MbMemberRoleDto.Item> selectById(String memberRoleId);

    List<MbMemberRoleDto.Item> selectList(MbMemberRoleDto.Request search);

    BasePage<MbMemberRoleDto.Item> selectPageData(MbMemberRoleDto.Request search);

    int updateSelective(MbMemberRole entity);
}
