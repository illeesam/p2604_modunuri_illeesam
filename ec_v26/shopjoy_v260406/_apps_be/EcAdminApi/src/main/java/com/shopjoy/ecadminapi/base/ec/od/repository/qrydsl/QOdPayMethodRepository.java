package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;

import java.util.List;
import java.util.Optional;

/** OdPayMethod QueryDSL Custom Repository */
public interface QOdPayMethodRepository {

    Optional<OdPayMethodDto.Item> selectById(String payMethodId);

    List<OdPayMethodDto.Item> selectList(OdPayMethodDto.Request search);

    OdPayMethodDto.PageResponse selectPageList(OdPayMethodDto.Request search);

    int updateSelective(OdPayMethod entity);
}
