package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;

import java.util.List;
import java.util.Optional;

/** SyI18n QueryDSL Custom Repository */
public interface QSyI18nRepository {
    Optional<SyI18nDto.Item> selectById(String i18nId);
    List<SyI18nDto.Item> selectList(SyI18nDto.Request search);
    SyI18nDto.PageResponse selectPageList(SyI18nDto.Request search);
    int updateSelective(SyI18n entity);
}
