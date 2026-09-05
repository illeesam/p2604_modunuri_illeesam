package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyNotice;

import java.util.List;
import java.util.Optional;

/** SyNotice QueryDSL Custom Repository */
public interface QSyNoticeRepository {
    Optional<SyNoticeDto.Item> selectById(String noticeId);
    List<SyNoticeDto.Item> selectList(SyNoticeDto.Request search);
    BasePage<SyNoticeDto.Item> selectPageData(SyNoticeDto.Request search);
    int updateSelective(SyNotice entity);
}
