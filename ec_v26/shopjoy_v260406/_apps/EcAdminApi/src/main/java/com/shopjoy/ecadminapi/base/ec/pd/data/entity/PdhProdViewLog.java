package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pdh_prod_view_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 조회 로그 엔티티
public class PdhProdViewLog {

    @Id
    @Column(name = "log_id", length = 21, nullable = false)
    private String logId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "session_key", length = 100)
    private String sessionKey;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "ref_id", length = 21)
    private String refId;

    @Column(name = "ref_nm", length = 200)
    private String refNm;

    @Column(name = "search_kw", length = 200)
    private String searchKw;

    @Column(name = "ip", length = 50)
    private String ip;

    @Column(name = "device", length = 200)
    private String device;

    @Column(name = "referrer", length = 500)
    private String referrer;

    @Column(name = "view_date")
    private LocalDateTime viewDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}