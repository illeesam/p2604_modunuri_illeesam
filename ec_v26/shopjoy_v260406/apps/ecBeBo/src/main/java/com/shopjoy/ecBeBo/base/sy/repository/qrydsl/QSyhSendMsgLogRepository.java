package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyhSendMsgLog;

import java.util.List;
import java.util.Optional;

/** SyhSendMsgLog QueryDSL Custom Repository */
public interface QSyhSendMsgLogRepository {

    /** 단건 조회 */
    Optional<SyhSendMsgLogDto.Item> selectById(String id);

    /** 전체 목록 */
    List<SyhSendMsgLogDto.Item> selectList(SyhSendMsgLogDto.Request search);

    /** 페이지 목록 */
    BasePage<SyhSendMsgLogDto.Item> selectPageData(SyhSendMsgLogDto.Request search);

    int updateSelective(SyhSendMsgLog entity);
}
