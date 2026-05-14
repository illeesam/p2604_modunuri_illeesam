package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;

import java.util.List;
import java.util.Optional;

/** SyCode QueryDSL Custom Repository */
public interface QSyCodeRepository {

    Optional<SyCodeDto.Item> selectById(String codeId);

    List<SyCodeDto.Item> selectList(SyCodeDto.Request search);

    SyCodeDto.PageResponse selectPageList(SyCodeDto.Request search);

    int updateSelective(SyCode entity);
}
