package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdBundleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdProdBundleItemRepository;

public interface PdProdBundleItemRepository extends JpaRepository<PdProdBundleItem, String>, QPdProdBundleItemRepository {
}
