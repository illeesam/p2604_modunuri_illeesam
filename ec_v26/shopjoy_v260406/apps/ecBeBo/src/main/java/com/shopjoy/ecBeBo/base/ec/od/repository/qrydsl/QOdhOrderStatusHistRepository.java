package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;

import java.util.List;
import java.util.Optional;

/** OdhOrderStatusHist QueryDSL Custom Repository */
public interface QOdhOrderStatusHistRepository {

    Optional<OdhOrderStatusHistDto.Item> selectById(String id);

    List<OdhOrderStatusHistDto.Item> selectList(OdhOrderStatusHistDto.Request search);

    BasePage<OdhOrderStatusHistDto.Item> selectPageData(OdhOrderStatusHistDto.Request search);

    int updateSelective(OdhOrderStatusHist entity);
}
