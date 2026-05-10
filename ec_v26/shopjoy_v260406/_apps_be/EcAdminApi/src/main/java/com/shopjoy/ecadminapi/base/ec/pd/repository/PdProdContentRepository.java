package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface PdProdContentRepository extends JpaRepository<PdProdContent, String> {

    /** 특정 상품의 모든 상품설명 블록 일괄 삭제 (전체 갱신 패턴용) */
    @Transactional
    void deleteByProdId(String prodId);
}
