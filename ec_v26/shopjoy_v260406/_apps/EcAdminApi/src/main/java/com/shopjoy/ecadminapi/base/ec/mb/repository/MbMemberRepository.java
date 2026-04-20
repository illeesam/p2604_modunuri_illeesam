package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MbMemberRepository extends JpaRepository<MbMember, String> {
    Optional<MbMember> findByMemberEmail(String memberEmail);
}
