package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;

import java.util.List;
import java.util.Optional;

/** SyNotice QueryDSL Custom Repository */
public interface QSyNoticeRepository {
    Optional<SyNoticeDto.Item> selectById(String noticeId);
    List<SyNoticeDto.Item> selectList(SyNoticeDto.Request search);
    SyNoticeDto.PageResponse selectPageList(SyNoticeDto.Request search);
    int updateSelective(SyNotice entity);
}
