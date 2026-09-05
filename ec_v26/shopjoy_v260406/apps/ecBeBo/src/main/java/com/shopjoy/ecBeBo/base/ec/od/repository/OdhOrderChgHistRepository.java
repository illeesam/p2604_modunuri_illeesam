package com.shopjoy.ecBeBo.base.ec.od.repository;

import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhOrderChgHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdhOrderChgHistRepository;

public interface OdhOrderChgHistRepository extends JpaRepository<OdhOrderChgHist, String>, QOdhOrderChgHistRepository {
}
