package com.shopjoy.eccdnapi.auth.repository;

import com.shopjoy.eccdnapi.auth.entity.CfTokenHist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CfTokenHistRepository extends JpaRepository<CfTokenHist, String> {

    /** 관리 화면 검색 — clientId 포함(빈 문자열이면 전체). */
    Page<CfTokenHist> findByClientIdContaining(String clientId, Pageable pageable);
}
