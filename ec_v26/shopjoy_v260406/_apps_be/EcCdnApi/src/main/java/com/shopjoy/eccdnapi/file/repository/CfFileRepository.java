package com.shopjoy.eccdnapi.file.repository;

import com.shopjoy.eccdnapi.file.entity.CfFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CfFileRepository extends JpaRepository<CfFile, String> {

    /** 관리 화면 검색 — 원본 파일명 keyword 포함(대소문자 구분, Postgres 기준). */
    Page<CfFile> findByOrigFileNmContaining(String keyword, Pageable pageable);

    /** 미디어 유형(IMAGE/VIDEO/FILE) 필터까지 같이 건 검색. */
    Page<CfFile> findByOrigFileNmContainingAndMediaTypeCd(String keyword, String mediaTypeCd, Pageable pageable);
}
