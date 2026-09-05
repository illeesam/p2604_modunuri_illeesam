package com.shopjoy.ecBeBo.base.ec.od.repository;

import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhPayStatusHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdhPayStatusHistRepository;

public interface OdhPayStatusHistRepository extends JpaRepository<OdhPayStatusHist, String>, QOdhPayStatusHistRepository {
}
