package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyVendor;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyVendorRepository;


public interface SyVendorRepository extends JpaRepository<SyVendor, String>, QSyVendorRepository {

}
