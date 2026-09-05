package com.shopjoy.ecBeBo.base.ec.pm.repository;

import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmGiftCond;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmGiftCondRepository;

public interface PmGiftCondRepository extends JpaRepository<PmGiftCond, String>, QPmGiftCondRepository {
}
