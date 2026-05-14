package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdDlivRepository;

public interface OdDlivRepository extends JpaRepository<OdDliv, String>, QOdDlivRepository {
}
