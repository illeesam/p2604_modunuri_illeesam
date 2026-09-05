package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyVendorUser;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyVendorUserRepository;

public interface SyVendorUserRepository extends JpaRepository<SyVendorUser, String>, QSyVendorUserRepository {
}
