package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdBundleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdBundleItemRepository;

public interface PdProdBundleItemRepository extends JpaRepository<PdProdBundleItem, String>, QPdProdBundleItemRepository {
}
