package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyCode;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyCodeRepository;

public interface SyCodeRepository extends JpaRepository<SyCode, String>, QSyCodeRepository {
}
