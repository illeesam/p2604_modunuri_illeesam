package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmDiscnt;

import java.util.List;
import java.util.Optional;

/** PmDiscnt QueryDSL Custom Repository */
public interface QPmDiscntRepository {

    Optional<PmDiscntDto.Item> selectById(String discntId);

    List<PmDiscntDto.Item> selectList(PmDiscntDto.Request search);

    BasePage<PmDiscntDto.Item> selectPageData(PmDiscntDto.Request search);

    int updateSelective(PmDiscnt entity);
}
