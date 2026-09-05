package com.shopjoy.ecadminapi.md.cb.repository;

import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbYarn;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.md.cb.repository.qrydsl.QMdCbYarnRepository;

public interface MdCbYarnRepository extends JpaRepository<MdCbYarn, String>, QMdCbYarnRepository {
}
