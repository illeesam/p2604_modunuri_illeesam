package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;

import java.util.List;
import java.util.Optional;

/** OdDliv QueryDSL Custom Repository */
public interface QOdDlivRepository {

    Optional<OdDlivDto.Item> selectById(String dlivId);

    List<OdDlivDto.Item> selectList(OdDlivDto.Request search);

    OdDlivDto.PageResponse selectPageList(OdDlivDto.Request search);

    int updateSelective(OdDliv entity);
}
