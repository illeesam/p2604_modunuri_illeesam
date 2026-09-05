package com.shopjoy.ecBeBo.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbDeviceToken;

import java.util.List;
import java.util.Optional;

/** MbDeviceToken QueryDSL Custom Repository */
public interface QMbDeviceTokenRepository {

    Optional<MbDeviceTokenDto.Item> selectById(String deviceTokenId);

    List<MbDeviceTokenDto.Item> selectList(MbDeviceTokenDto.Request search);

    BasePage<MbDeviceTokenDto.Item> selectPageData(MbDeviceTokenDto.Request search);

    int updateSelective(MbDeviceToken entity);
}
