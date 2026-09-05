package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;

import java.util.List;
import java.util.Optional;

/** MbhMemberLoginLog QueryDSL Custom Repository */
public interface QMbhMemberLoginLogRepository {

    Optional<MbhMemberLoginLogDto.Item> selectById(String logId);

    List<MbhMemberLoginLogDto.Item> selectList(MbhMemberLoginLogDto.Request search);

    BasePage<MbhMemberLoginLogDto.Item> selectPageData(MbhMemberLoginLogDto.Request search);

    int updateSelective(MbhMemberLoginLog entity);
}
