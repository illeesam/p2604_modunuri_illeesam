package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyNoticeRepository;

public interface SyNoticeRepository extends JpaRepository<SyNotice, String>, QSyNoticeRepository {
}
