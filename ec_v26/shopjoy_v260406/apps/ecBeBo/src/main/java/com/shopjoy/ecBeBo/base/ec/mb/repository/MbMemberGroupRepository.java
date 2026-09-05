package com.shopjoy.ecBeBo.base.ec.mb.repository;

import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMemberGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.mb.repository.qrydsl.QMbMemberGroupRepository;

public interface MbMemberGroupRepository extends JpaRepository<MbMemberGroup, String>, QMbMemberGroupRepository {
}
