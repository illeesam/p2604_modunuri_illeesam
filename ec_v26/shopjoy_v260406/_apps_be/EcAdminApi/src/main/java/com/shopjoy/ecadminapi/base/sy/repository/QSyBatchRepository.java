package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;

import java.util.List;
import java.util.Optional;

/** SyBatch QueryDSL Custom Repository */
public interface QSyBatchRepository {
    Optional<SyBatchDto.Item> selectById(String batchId);
    List<SyBatchDto.Item> selectList(SyBatchDto.Request search);
    SyBatchDto.PageResponse selectPageList(SyBatchDto.Request search);
    int updateSelective(SyBatch entity);
}
