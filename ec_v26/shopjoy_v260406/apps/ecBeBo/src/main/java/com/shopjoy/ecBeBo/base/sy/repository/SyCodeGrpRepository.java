package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyCodeGrp;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyCodeGrpRepository;


public interface SyCodeGrpRepository extends JpaRepository<SyCodeGrp, String>, QSyCodeGrpRepository {

}
