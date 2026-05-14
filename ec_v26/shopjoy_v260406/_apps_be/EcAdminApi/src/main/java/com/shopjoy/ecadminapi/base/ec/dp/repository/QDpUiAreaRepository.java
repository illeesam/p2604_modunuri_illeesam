package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUiArea;

import java.util.List;
import java.util.Optional;

/** DpUiArea QueryDSL Custom Repository */
public interface QDpUiAreaRepository {

    Optional<DpUiAreaDto.Item> selectById(String uiAreaId);

    List<DpUiAreaDto.Item> selectList(DpUiAreaDto.Request search);

    DpUiAreaDto.PageResponse selectPageList(DpUiAreaDto.Request search);

    int updateSelective(DpUiArea entity);
}
