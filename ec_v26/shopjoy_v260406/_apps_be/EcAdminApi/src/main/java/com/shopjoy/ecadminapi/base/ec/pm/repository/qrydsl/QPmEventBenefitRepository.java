package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;

import java.util.List;
import java.util.Optional;

/** PmEventBenefit QueryDSL Custom Repository */
public interface QPmEventBenefitRepository {

    Optional<PmEventBenefitDto.Item> selectById(String benefitId);

    List<PmEventBenefitDto.Item> selectList(PmEventBenefitDto.Request search);

    PmEventBenefitDto.PageResponse selectPageList(PmEventBenefitDto.Request search);

    int updateSelective(PmEventBenefit entity);
}
