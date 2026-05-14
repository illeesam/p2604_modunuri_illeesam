package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyCodeGrpRepository;

public interface SyCodeGrpRepository extends JpaRepository<SyCodeGrp, String>, QSyCodeGrpRepository {
}
