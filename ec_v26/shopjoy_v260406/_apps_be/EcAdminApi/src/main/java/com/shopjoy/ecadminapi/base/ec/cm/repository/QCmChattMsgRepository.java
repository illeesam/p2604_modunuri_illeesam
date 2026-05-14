package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;

import java.util.List;
import java.util.Optional;

/** CmChattMsg QueryDSL Custom Repository */
public interface QCmChattMsgRepository {

    /** 단건 조회 */
    Optional<CmChattMsgDto.Item> selectById(String chattMsgId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<CmChattMsgDto.Item> selectList(CmChattMsgDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    CmChattMsgDto.PageResponse selectPageList(CmChattMsgDto.Request search);

    int updateSelective(CmChattMsg entity);
}
