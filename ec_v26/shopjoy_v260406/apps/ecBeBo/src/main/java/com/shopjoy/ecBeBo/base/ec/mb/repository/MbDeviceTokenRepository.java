package com.shopjoy.ecBeBo.base.ec.mb.repository;

import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbDeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.mb.repository.qrydsl.QMbDeviceTokenRepository;

public interface MbDeviceTokenRepository extends JpaRepository<MbDeviceToken, String>, QMbDeviceTokenRepository {
}
