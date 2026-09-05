package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntProd;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntProdRepository;

public interface PmDiscntProdRepository extends JpaRepository<PmDiscntProd, String>, QPmDiscntProdRepository {
}
