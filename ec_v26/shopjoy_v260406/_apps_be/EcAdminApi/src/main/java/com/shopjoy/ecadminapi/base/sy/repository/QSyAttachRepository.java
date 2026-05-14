package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;

import java.util.List;
import java.util.Optional;

/** SyAttach QueryDSL Custom Repository */
public interface QSyAttachRepository {
    Optional<SyAttachDto.Item> selectById(String attachId);
    List<SyAttachDto.Item> selectList(SyAttachDto.Request search);
    SyAttachDto.PageResponse selectPageList(SyAttachDto.Request search);
    int updateSelective(SyAttach entity);
}
