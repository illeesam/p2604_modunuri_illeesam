package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventProd;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventProdRepository;

public interface PmEventProdRepository extends JpaRepository<PmEventProd, String>, QPmEventProdRepository {
}
