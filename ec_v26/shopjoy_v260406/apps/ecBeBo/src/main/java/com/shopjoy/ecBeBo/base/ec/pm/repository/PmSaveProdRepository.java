package com.shopjoy.ecBeBo.base.ec.pm.repository;

import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmSaveProd;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmSaveProdRepository;

public interface PmSaveProdRepository extends JpaRepository<PmSaveProd, String>, QPmSaveProdRepository {
}
