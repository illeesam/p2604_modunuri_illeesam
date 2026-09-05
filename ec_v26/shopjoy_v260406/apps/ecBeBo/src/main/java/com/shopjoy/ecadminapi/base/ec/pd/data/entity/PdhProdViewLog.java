package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pdh_prod_view_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 조회 로그 엔티티
@Comment("상품/페이지 조회 로그")
public class PdhProdViewLog extends BaseEntity {

    @Id
    @Comment("로그ID (YYMMDDhhmmss+rand4)")
    @Column(name = "log_id", length = 21, nullable = false)
    @Size(max = 21, message = "logId 는 21자 이내여야 합니다.")
    private String logId;


    @Comment("회원ID (비회원 NULL)")
    @Column(name = "member_id", length = 21)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("비회원 세션키")
    @Column(name = "session_key", length = 100)
    @Size(max = 100, message = "sessionKey 는 100자 이내여야 합니다.")
    private String sessionKey;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("참조ID (prod_id 등)")
    @Column(name = "ref_id", length = 21)
    @Size(max = 21, message = "refId 는 21자 이내여야 합니다.")
    private String refId;

    @Comment("참조명 스냅샷")
    @Column(name = "ref_nm", length = 200)
    @Size(max = 200, message = "refNm 는 200자 이내여야 합니다.")
    private String refNm;

    @Comment("검색어 (SEARCH 유형)")
    @Column(name = "search_kw", length = 200)
    @Size(max = 200, message = "searchKw 는 200자 이내여야 합니다.")
    private String searchKw;

    @Comment("IP주소")
    @Column(name = "ip", length = 50)
    @Size(max = 50, message = "ip 는 50자 이내여야 합니다.")
    private String ip;

    @Comment("User-Agent")
    @Column(name = "device", length = 200)
    @Size(max = 200, message = "device 는 200자 이내여야 합니다.")
    private String device;

    @Comment("유입경로 URL")
    @Column(name = "referrer", length = 500)
    @Size(max = 500, message = "referrer 는 500자 이내여야 합니다.")
    private String referrer;

    @Comment("조회일시")
    @Column(name = "view_date")
    private LocalDateTime viewDate;

}
