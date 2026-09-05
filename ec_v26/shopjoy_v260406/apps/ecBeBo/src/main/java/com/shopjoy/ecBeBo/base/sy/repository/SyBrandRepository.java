package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyBrand;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyBrandRepository;


public interface SyBrandRepository extends JpaRepository<SyBrand, String>, QSyBrandRepository {
}
