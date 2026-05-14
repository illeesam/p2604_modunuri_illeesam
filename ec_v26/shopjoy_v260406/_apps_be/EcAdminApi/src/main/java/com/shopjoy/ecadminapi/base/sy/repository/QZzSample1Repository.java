package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample1;

import java.util.List;
import java.util.Optional;

/** ZzSample1 QueryDSL Custom Repository */
public interface QZzSample1Repository {

    /** 단건 조회 */
    Optional<ZzSample1Dto.Item> selectById(String id);

    /** 전체 목록 */
    List<ZzSample1Dto.Item> selectList(ZzSample1Dto.Request search);

    /** 페이지 목록 */
    ZzSample1Dto.PageResponse selectPageList(ZzSample1Dto.Request search);

    int updateSelective(ZzSample1 entity);
}
