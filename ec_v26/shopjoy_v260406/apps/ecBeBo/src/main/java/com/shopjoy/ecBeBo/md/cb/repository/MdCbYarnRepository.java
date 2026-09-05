package com.shopjoy.ecBeBo.md.cb.repository;

import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbYarn;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.md.cb.repository.qrydsl.QMdCbYarnRepository;

public interface MdCbYarnRepository extends JpaRepository<MdCbYarn, String>, QMdCbYarnRepository {
}
