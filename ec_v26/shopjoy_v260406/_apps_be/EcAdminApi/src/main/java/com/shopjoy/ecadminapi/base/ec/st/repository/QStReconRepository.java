package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;

import java.util.List;
import java.util.Optional;

/** StRecon QueryDSL Custom Repository */
public interface QStReconRepository {

    Optional<StReconDto.Item> selectById(String id);

    List<StReconDto.Item> selectList(StReconDto.Request search);

    StReconDto.PageResponse selectPageList(StReconDto.Request search);

    int updateSelective(StRecon entity);
}
