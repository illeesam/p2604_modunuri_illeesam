package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorContent;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorContentRepository;

public interface SyVendorContentRepository extends JpaRepository<SyVendorContent, String>, QSyVendorContentRepository {
}
