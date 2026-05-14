package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorUserRepository;

public interface SyVendorUserRepository extends JpaRepository<SyVendorUser, String>, QSyVendorUserRepository {
}
