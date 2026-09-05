package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyCode;

import java.util.List;
import java.util.Optional;

/** SyCode QueryDSL Custom Repository */
public interface QSyCodeRepository {

    Optional<SyCodeDto.Item> selectById(String codeId);

    List<SyCodeDto.Item> selectList(SyCodeDto.Request search);

    BasePage<SyCodeDto.Item> selectPageData(SyCodeDto.Request search);

    int updateSelective(SyCode entity);
}
