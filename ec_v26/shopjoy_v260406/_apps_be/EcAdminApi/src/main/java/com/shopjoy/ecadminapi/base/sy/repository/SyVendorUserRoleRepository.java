package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SyVendorUserRoleRepository extends JpaRepository<SyVendorUserRole, String> {
    List<SyVendorUserRole> findByUserId(String userId);
}
