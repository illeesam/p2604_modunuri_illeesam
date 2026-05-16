package com.shopjoy.ecadminapi.base.zz.repository.qrydsl;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample3;

import java.util.List;
import java.util.Optional;

/** ZzSample3 QueryDSL Custom Repository */
public interface QZzSample3Repository {

    /** 단건 조회 */
    Optional<ZzSample3Dto.Item> selectById(String id);

    /** 전체 목록 */
    List<ZzSample3Dto.Item> selectList(ZzSample3Dto.Request search);

    /** 페이지 목록 */
    ZzSample3Dto.PageResponse selectPageList(ZzSample3Dto.Request search);

    int updateSelective(ZzSample3 entity);
}
