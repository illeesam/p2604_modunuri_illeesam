package com.shopjoy.ecBeCdn.auth.repository;

import com.shopjoy.ecBeCdn.auth.entity.CfClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CfClientRepository extends JpaRepository<CfClient, String> {

    /** 관리 화면 검색 — clientId 또는 clientNm 에 keyword 포함(같은 값을 두 번 전달). */
    Page<CfClient> findByClientIdContainingOrClientNmContaining(String clientId, String clientNm, Pageable pageable);
}
