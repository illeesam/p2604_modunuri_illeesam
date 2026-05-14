package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;

import java.util.List;
import java.util.Optional;

/** MbhMemberLoginLog QueryDSL Custom Repository */
public interface QMbhMemberLoginLogRepository {

    Optional<MbhMemberLoginLogDto.Item> selectById(String logId);

    List<MbhMemberLoginLogDto.Item> selectList(MbhMemberLoginLogDto.Request search);

    MbhMemberLoginLogDto.PageResponse selectPageList(MbhMemberLoginLogDto.Request search);

    int updateSelective(MbhMemberLoginLog entity);
}
