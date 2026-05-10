package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MbMemberRoleRepository extends JpaRepository<MbMemberRole, String> {
    List<MbMemberRole> findByMemberId(String memberId);
}
