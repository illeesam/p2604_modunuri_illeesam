package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchHist;

import java.util.List;
import java.util.Optional;

/** SyhBatchHist QueryDSL Custom Repository */
public interface QSyhBatchHistRepository {

    /** 단건 조회 */
    Optional<SyhBatchHistDto.Item> selectById(String id);

    /** 전체 목록 */
    List<SyhBatchHistDto.Item> selectList(SyhBatchHistDto.Request search);

    /** 페이지 목록 */
    SyhBatchHistDto.PageResponse selectPageList(SyhBatchHistDto.Request search);

    int updateSelective(SyhBatchHist entity);
}
