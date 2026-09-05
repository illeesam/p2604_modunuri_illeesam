package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMember;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmChattMemberRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CmChattMemberRepository extends JpaRepository<CmChattMember, String>, QCmChattMemberRepository {
}
