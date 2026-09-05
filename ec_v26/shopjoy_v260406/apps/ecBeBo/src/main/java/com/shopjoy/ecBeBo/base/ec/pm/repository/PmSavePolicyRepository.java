package com.shopjoy.ecBeBo.base.ec.pm.repository;

import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmSavePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmSavePolicyRepository;

public interface PmSavePolicyRepository extends JpaRepository<PmSavePolicy, String>, QPmSavePolicyRepository {
}
