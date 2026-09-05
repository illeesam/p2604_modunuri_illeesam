package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyVendorBrand;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyVendorBrandRepository;

public interface SyVendorBrandRepository extends JpaRepository<SyVendorBrand, String>, QSyVendorBrandRepository {
}
