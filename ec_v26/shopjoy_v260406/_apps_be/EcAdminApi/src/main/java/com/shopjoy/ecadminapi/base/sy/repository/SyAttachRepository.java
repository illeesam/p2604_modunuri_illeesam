package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAttachRepository;

public interface SyAttachRepository extends JpaRepository<SyAttach, String>, QSyAttachRepository {

    /** 첨부그룹 여러 건의 파일을 한 번에 — 목록 화면에서 행마다 조회하면 N+1 이 된다 */
    List<SyAttach> findByAttachGrpIdInOrderByAttachGrpIdAscSortOrdAscAttachIdAsc(List<String> attachGrpIds);
}
