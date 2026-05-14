package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;

import java.util.List;
import java.util.Optional;

/** SyhSendMsgLog QueryDSL Custom Repository */
public interface QSyhSendMsgLogRepository {

    /** 단건 조회 */
    Optional<SyhSendMsgLogDto.Item> selectById(String id);

    /** 전체 목록 */
    List<SyhSendMsgLogDto.Item> selectList(SyhSendMsgLogDto.Request search);

    /** 페이지 목록 */
    SyhSendMsgLogDto.PageResponse selectPageList(SyhSendMsgLogDto.Request search);

    int updateSelective(SyhSendMsgLog entity);
}
