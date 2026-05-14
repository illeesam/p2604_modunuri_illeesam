package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntUsageRepository;

public interface PmDiscntUsageRepository extends JpaRepository<PmDiscntUsage, String>, QPmDiscntUsageRepository {
}
