package com.shopjoy.ecBeBo.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMemberRole;

import java.util.List;
import java.util.Optional;

/** MbMemberRole QueryDSL Custom Repository */
public interface QMbMemberRoleRepository {

    Optional<MbMemberRoleDto.Item> selectById(String memberRoleId);

    List<MbMemberRoleDto.Item> selectList(MbMemberRoleDto.Request search);

    BasePage<MbMemberRoleDto.Item> selectPageData(MbMemberRoleDto.Request search);

    int updateSelective(MbMemberRole entity);
}
