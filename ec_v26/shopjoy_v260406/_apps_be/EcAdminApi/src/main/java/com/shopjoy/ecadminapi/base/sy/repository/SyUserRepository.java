package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SyUserRepository extends JpaRepository<SyUser, String> {
}
