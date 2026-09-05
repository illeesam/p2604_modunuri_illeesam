package com.shopjoy.ecBeBo.base.ec.od.repository;

import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhDlivChgHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdhDlivChgHistRepository;

public interface OdhDlivChgHistRepository extends JpaRepository<OdhDlivChgHist, String>, QOdhDlivChgHistRepository {
}
