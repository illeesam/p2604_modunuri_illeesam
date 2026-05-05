package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface PdProdOptItemRepository extends JpaRepository<PdProdOptItem, String> {

    void deleteByOptIdIn(Collection<String> optIds);
}
