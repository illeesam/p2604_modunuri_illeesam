package com.shopjoy.ecadminapi.bo.zd;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ZdSimulLogRepository extends JpaRepository<ZdSimulLog, String> {

    @Query("SELECT l FROM ZdSimulLog l WHERE l.siteId = :siteId" +
           " AND (:domain IS NULL OR l.domain = :domain)" +
           " AND (:uiNm IS NULL OR l.uiNm LIKE %:uiNm%)" +
           " AND (:userNm IS NULL OR l.userNm LIKE %:userNm%)" +
           " ORDER BY l.regDate DESC")
    Page<ZdSimulLog> search(
        @Param("siteId")  String siteId,
        @Param("domain")  String domain,
        @Param("uiNm")    String uiNm,
        @Param("userNm")  String userNm,
        Pageable pageable);
}
