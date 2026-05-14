package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;

import java.util.List;
import java.util.Optional;

/** SyAttachGrp QueryDSL Custom Repository */
public interface QSyAttachGrpRepository {
    Optional<SyAttachGrpDto.Item> selectById(String attachGrpId);
    List<SyAttachGrpDto.Item> selectList(SyAttachGrpDto.Request search);
    SyAttachGrpDto.PageResponse selectPageList(SyAttachGrpDto.Request search);
    int updateSelective(SyAttachGrp entity);
}
