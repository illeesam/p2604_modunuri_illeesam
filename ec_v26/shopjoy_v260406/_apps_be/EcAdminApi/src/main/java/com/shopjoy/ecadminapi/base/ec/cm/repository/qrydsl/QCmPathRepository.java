package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPathDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPath;

import java.util.List;
import java.util.Optional;

/** CmPath QueryDSL Custom Repository */
public interface QCmPathRepository {

    /** 단건 조회 */
    Optional<CmPathDto.Item> selectById(String bizCd);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<CmPathDto.Item> selectList(CmPathDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    CmPathDto.PageResponse selectPageList(CmPathDto.Request search);

    int updateSelective(CmPath entity);
}
