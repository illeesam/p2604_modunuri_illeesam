package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChatt;

import java.util.List;
import java.util.Optional;

/** CmChatt QueryDSL Custom Repository */
public interface QCmChattRepository {

    Optional<CmChattDto.Item> selectById(String chattId);

    List<CmChattDto.Item> selectList(CmChattDto.Request search);

    CmChattDto.PageResponse selectPageData(CmChattDto.Request search);

    int updateSelective(CmChatt entity);
}
