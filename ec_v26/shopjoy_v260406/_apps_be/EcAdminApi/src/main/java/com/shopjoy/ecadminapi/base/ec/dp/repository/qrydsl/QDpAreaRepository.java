package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;

import java.util.List;
import java.util.Optional;

public interface QDpAreaRepository {
    Optional<DpAreaDto.Item> selectById(String areaId);
    List<DpAreaDto.Item> selectList(DpAreaDto.Request search);
    DpAreaDto.PageResponse selectPageList(DpAreaDto.Request search);
    int updateSelective(DpArea entity);
}
