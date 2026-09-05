package com.shopjoy.ecBeBo.base.ec.od.repository;

import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhPayChgHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdhPayChgHistRepository;

public interface OdhPayChgHistRepository extends JpaRepository<OdhPayChgHist, String>, QOdhPayChgHistRepository {
}
