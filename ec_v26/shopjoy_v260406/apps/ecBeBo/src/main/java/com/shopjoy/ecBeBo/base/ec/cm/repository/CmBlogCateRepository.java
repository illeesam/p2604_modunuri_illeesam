package com.shopjoy.ecBeBo.base.ec.cm.repository;

import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmBlogCate;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl.QCmBlogCateRepository;

/* 블로그카테고리 트리 자손ID 수집(findTreeBlogCateIds, 재귀 CTE) → QCmBlogCateRepository.selectTreeBlogCateIds (QueryDSL) 로 전환 */
public interface CmBlogCateRepository extends JpaRepository<CmBlogCate, String>, QCmBlogCateRepository {
}
