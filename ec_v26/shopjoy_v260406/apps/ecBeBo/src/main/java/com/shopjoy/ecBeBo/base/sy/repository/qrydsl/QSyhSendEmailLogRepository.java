package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyhSendEmailLog;

import java.util.List;
import java.util.Optional;

/** SyhSendEmailLog QueryDSL Custom Repository */
public interface QSyhSendEmailLogRepository {

    /** 단건 조회 */
    Optional<SyhSendEmailLogDto.Item> selectById(String id);

    /** 전체 목록 */
    List<SyhSendEmailLogDto.Item> selectList(SyhSendEmailLogDto.Request search);

    /** 페이지 목록 */
    BasePage<SyhSendEmailLogDto.Item> selectPageData(SyhSendEmailLogDto.Request search);

    int updateSelective(SyhSendEmailLog entity);
}
