package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderDiscnt;

import java.util.List;
import java.util.Optional;

/** OdOrderDiscnt QueryDSL Custom Repository */
public interface QOdOrderDiscntRepository {

    Optional<OdOrderDiscntDto.Item> selectById(String orderDiscntId);

    List<OdOrderDiscntDto.Item> selectList(OdOrderDiscntDto.Request search);

    OdOrderDiscntDto.PageResponse selectPageList(OdOrderDiscntDto.Request search);

    int updateSelective(OdOrderDiscnt entity);
}
