package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SyUserRoleRepository extends JpaRepository<SyUserRole, String> {
    List<SyUserRole> findByUserId(String userId);
}
