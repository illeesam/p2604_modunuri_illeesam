package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;

import java.util.List;
import java.util.Optional;

/** MbDeviceToken QueryDSL Custom Repository */
public interface QMbDeviceTokenRepository {

    Optional<MbDeviceTokenDto.Item> selectById(String deviceTokenId);

    List<MbDeviceTokenDto.Item> selectList(MbDeviceTokenDto.Request search);

    MbDeviceTokenDto.PageResponse selectPageList(MbDeviceTokenDto.Request search);

    int updateSelective(MbDeviceToken entity);
}
