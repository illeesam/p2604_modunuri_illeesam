package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorBrand;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorBrandRepository;

public interface SyVendorBrandRepository extends JpaRepository<SyVendorBrand, String>, QSyVendorBrandRepository {
}
