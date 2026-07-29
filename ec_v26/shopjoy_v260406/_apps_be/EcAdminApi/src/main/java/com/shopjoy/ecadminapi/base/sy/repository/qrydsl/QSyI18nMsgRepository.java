package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;

import java.util.List;
import java.util.Optional;

/** SyI18nMsg QueryDSL Custom Repository */
public interface QSyI18nMsgRepository {
    Optional<SyI18nMsgDto.Item> selectById(String i18nMsgId);
    List<SyI18nMsgDto.Item> selectList(SyI18nMsgDto.Request search);
    BasePage<SyI18nMsgDto.Item> selectPageData(SyI18nMsgDto.Request search);
    int updateSelective(SyI18nMsg entity);
}
