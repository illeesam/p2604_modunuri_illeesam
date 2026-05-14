package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;

import java.util.List;
import java.util.Optional;

/** DpUi QueryDSL Custom Repository */
public interface QDpUiRepository {

    Optional<DpUiDto.Item> selectById(String uiId);

    List<DpUiDto.Item> selectList(DpUiDto.Request search);

    DpUiDto.PageResponse selectPageList(DpUiDto.Request search);

    int updateSelective(DpUi entity);
}
