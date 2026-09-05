package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyAttach;
import org.springframework.data.jpa.repository.JpaRepository;

import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyAttachRepository;

import java.util.List;

public interface SyAttachRepository extends JpaRepository<SyAttach, String>, QSyAttachRepository {

    /** N+1 방지 배치조회 — refId asc, sortOrd asc, attachId asc */
    List<SyAttach> findByRefTableNmAndRefIdInOrderByRefIdAscSortOrdAscAttachIdAsc(String refTableNm, List<String> refIds);
}
