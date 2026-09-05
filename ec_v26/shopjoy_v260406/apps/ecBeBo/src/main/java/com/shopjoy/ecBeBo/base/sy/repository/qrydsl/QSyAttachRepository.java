package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyAttach;

import java.util.List;
import java.util.Optional;

/** SyAttach QueryDSL Custom Repository */
public interface QSyAttachRepository {
    Optional<SyAttachDto.Item> selectById(String attachId);

    List<SyAttachDto.Item> selectList(SyAttachDto.Request search);
    BasePage<SyAttachDto.Item> selectPageData(SyAttachDto.Request search);
    int updateSelective(SyAttach entity);
}
