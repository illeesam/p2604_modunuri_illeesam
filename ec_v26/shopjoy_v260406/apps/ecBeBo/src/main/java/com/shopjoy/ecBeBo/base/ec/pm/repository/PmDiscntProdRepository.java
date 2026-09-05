package com.shopjoy.ecBeBo.base.ec.pm.repository;

import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmDiscntProd;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmDiscntProdRepository;

public interface PmDiscntProdRepository extends JpaRepository<PmDiscntProd, String>, QPmDiscntProdRepository {
}
