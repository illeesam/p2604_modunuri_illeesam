package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdCategoryRepository;

/* 카테고리 트리 자손ID 수집(findTreeCategoryIds, 재귀 CTE) → QPdCategoryRepository.selectTreeCategoryIds (QueryDSL) 로 전환 */
public interface PdCategoryRepository extends JpaRepository<PdCategory, String>, QPdCategoryRepository {
}
