package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;

import java.util.List;
import java.util.Optional;

/** SyTemplate QueryDSL Custom Repository */
public interface QSyTemplateRepository {
    Optional<SyTemplateDto.Item> selectById(String templateId);
    List<SyTemplateDto.Item> selectList(SyTemplateDto.Request search);
    SyTemplateDto.PageResponse selectPageList(SyTemplateDto.Request search);
    int updateSelective(SyTemplate entity);
}
