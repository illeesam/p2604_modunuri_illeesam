package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MbMemberSnsRepository extends JpaRepository<MbMemberSns, String>, QMbMemberSnsRepository {
}
