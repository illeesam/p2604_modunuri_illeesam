package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pm_cache", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 캐시(충전금) 엔티티
@Comment("적립금 (캐시)")
public class PmCache extends BaseEntity {

    @Id
    @Comment("적립금ID (YYMMDDhhmmss+rand4)")
    @Column(name = "cache_id", length = 21, nullable = false)
    private String cacheId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("회원ID")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("회원명")
    @Column(name = "member_nm", length = 50)
    private String memberNm;

    @Comment("유형 (코드: CACHE_TYPE)")
    @Column(name = "cache_type_cd", length = 20, nullable = false)
    private String cacheTypeCd;

    @Comment("금액 (양수:적립 / 음수:차감)")
    @Column(name = "cache_amt")
    private Long cacheAmt;

    @Comment("처리후 잔액")
    @Column(name = "balance_amt")
    private Long balanceAmt;

    @Comment("참조ID (주문ID 등)")
    @Column(name = "ref_id", length = 21)
    private String refId;

    @Comment("내역 설명")
    @Column(name = "cache_desc", length = 200)
    private String cacheDesc;

    @Comment("처리자 (관리자 직접 부여시)")
    @Column(name = "proc_user_id", length = 21)
    private String procUserId;

    @Comment("처리일시")
    @Column(name = "cache_date")
    private LocalDateTime cacheDate;

    @Comment("소멸예정일")
    @Column(name = "expire_date")
    private LocalDate expireDate;

}
