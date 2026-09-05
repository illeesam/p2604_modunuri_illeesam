package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmEventBenefit;

import java.util.List;
import java.util.Optional;

/** PmEventBenefit QueryDSL Custom Repository */
public interface QPmEventBenefitRepository {

    Optional<PmEventBenefitDto.Item> selectById(String eventBenefitId);

    List<PmEventBenefitDto.Item> selectList(PmEventBenefitDto.Request search);

    BasePage<PmEventBenefitDto.Item> selectPageData(PmEventBenefitDto.Request search);

    int updateSelective(PmEventBenefit entity);
}
