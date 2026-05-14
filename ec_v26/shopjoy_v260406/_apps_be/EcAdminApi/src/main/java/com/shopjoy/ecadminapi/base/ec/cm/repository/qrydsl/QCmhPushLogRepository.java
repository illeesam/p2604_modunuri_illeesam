package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmhPushLogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmhPushLog;

import java.util.List;
import java.util.Optional;

/** CmhPushLog QueryDSL Custom Repository */
public interface QCmhPushLogRepository {

    /** 단건 조회 */
    Optional<CmhPushLogDto.Item> selectById(String logId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<CmhPushLogDto.Item> selectList(CmhPushLogDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    CmhPushLogDto.PageResponse selectPageList(CmhPushLogDto.Request search);

    int updateSelective(CmhPushLog entity);
}
