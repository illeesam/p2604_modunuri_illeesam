package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdhPayStatusHistDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhPayStatusHist;

import java.util.List;
import java.util.Optional;

/** OdhPayStatusHist QueryDSL Custom Repository */
public interface QOdhPayStatusHistRepository {

    Optional<OdhPayStatusHistDto.Item> selectById(String id);

    List<OdhPayStatusHistDto.Item> selectList(OdhPayStatusHistDto.Request search);

    BasePage<OdhPayStatusHistDto.Item> selectPageData(OdhPayStatusHistDto.Request search);

    int updateSelective(OdhPayStatusHist entity);
}
