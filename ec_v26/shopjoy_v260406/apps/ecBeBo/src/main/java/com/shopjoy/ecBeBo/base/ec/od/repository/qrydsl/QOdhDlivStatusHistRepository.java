package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhDlivStatusHist;

import java.util.List;
import java.util.Optional;

/** OdhDlivStatusHist QueryDSL Custom Repository */
public interface QOdhDlivStatusHistRepository {

    Optional<OdhDlivStatusHistDto.Item> selectById(String id);

    List<OdhDlivStatusHistDto.Item> selectList(OdhDlivStatusHistDto.Request search);

    BasePage<OdhDlivStatusHistDto.Item> selectPageData(OdhDlivStatusHistDto.Request search);

    int updateSelective(OdhDlivStatusHist entity);
}
