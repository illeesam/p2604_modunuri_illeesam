package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyVendorContent;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyVendorContentRepository;

public interface SyVendorContentRepository extends JpaRepository<SyVendorContent, String>, QSyVendorContentRepository {
}
