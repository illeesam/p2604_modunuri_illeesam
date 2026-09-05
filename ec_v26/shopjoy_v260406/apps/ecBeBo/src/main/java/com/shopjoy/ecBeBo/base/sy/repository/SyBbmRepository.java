package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyBbm;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyBbmRepository;


public interface SyBbmRepository extends JpaRepository<SyBbm, String>, QSyBbmRepository {

}
