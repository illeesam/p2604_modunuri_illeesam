package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;

import java.util.List;
import java.util.Optional;

/** SyCodeGrp QueryDSL Custom Repository */
public interface QSyCodeGrpRepository {

    Optional<SyCodeGrpDto.Item> selectById(String codeGrpId);

    List<SyCodeGrpDto.Item> selectList(SyCodeGrpDto.Request search);

    SyCodeGrpDto.PageResponse selectPageList(SyCodeGrpDto.Request search);

    int updateSelective(SyCodeGrp entity);
}
