package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample0Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample0;

import java.util.List;
import java.util.Optional;

/** ZzSample0 QueryDSL Custom Repository */
public interface QZzSample0Repository {

    /** 단건 조회 */
    Optional<ZzSample0Dto.Item> selectById(String id);

    /** 전체 목록 */
    List<ZzSample0Dto.Item> selectList(ZzSample0Dto.Request search);

    /** 페이지 목록 */
    ZzSample0Dto.PageResponse selectPageList(ZzSample0Dto.Request search);

    int updateSelective(ZzSample0 entity);
}
