package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;

import java.util.List;
import java.util.Optional;

/** MbhMemberTokenLog QueryDSL Custom Repository */
public interface QMbhMemberTokenLogRepository {

    Optional<MbhMemberTokenLogDto.Item> selectById(String logId);

    List<MbhMemberTokenLogDto.Item> selectList(MbhMemberTokenLogDto.Request search);

    BasePage<MbhMemberTokenLogDto.Item> selectPageData(MbhMemberTokenLogDto.Request search);

    int updateSelective(MbhMemberTokenLog entity);
}
