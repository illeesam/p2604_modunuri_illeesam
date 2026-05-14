package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberRepository;

public interface MbMemberRepository extends JpaRepository<MbMember, String>, QMbMemberRepository {
    Optional<MbMember> findByLoginId(String loginId);
}
