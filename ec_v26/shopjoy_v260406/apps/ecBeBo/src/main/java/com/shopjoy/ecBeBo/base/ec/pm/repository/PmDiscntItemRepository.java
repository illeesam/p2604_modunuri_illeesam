package com.shopjoy.ecBeBo.base.ec.pm.repository;

import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmDiscntItem;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmDiscntItemRepository;

public interface PmDiscntItemRepository extends JpaRepository<PmDiscntItem, String>, QPmDiscntItemRepository {
}
