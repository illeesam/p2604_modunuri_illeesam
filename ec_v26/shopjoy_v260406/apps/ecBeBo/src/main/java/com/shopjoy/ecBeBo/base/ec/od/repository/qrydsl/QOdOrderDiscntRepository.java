package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdOrderDiscntDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdOrderDiscnt;

import java.util.List;
import java.util.Optional;

/** OdOrderDiscnt QueryDSL Custom Repository */
public interface QOdOrderDiscntRepository {

    Optional<OdOrderDiscntDto.Item> selectById(String orderDiscntId);

    List<OdOrderDiscntDto.Item> selectList(OdOrderDiscntDto.Request search);

    BasePage<OdOrderDiscntDto.Item> selectPageData(OdOrderDiscntDto.Request search);

    int updateSelective(OdOrderDiscnt entity);
}
