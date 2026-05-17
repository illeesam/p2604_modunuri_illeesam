package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "od_pay_method", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 결제수단 엔티티
@Comment("마이페이지 등록 결제수단")
public class OdPayMethod extends BaseEntity {

    @Id
    @Comment("결제수단ID (YYMMDDhhmmss+rand4)")
    @Column(name = "pay_method_id", length = 21, nullable = false)
    private String payMethodId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("결제수단유형코드 (코드: PAY_METHOD)")
    @Column(name = "pay_method_type_cd", length = 20, nullable = false)
    private String payMethodTypeCd;

    @Comment("결제수단명 (카드사명, 은행명 등)")
    @Column(name = "pay_method_nm", length = 100, nullable = false)
    private String payMethodNm;

    @Comment("별칭 (사용자 설정)")
    @Column(name = "pay_method_alias", length = 100)
    private String payMethodAlias;

    @Comment("결제 게이트웨이 발급 키/토큰")
    @Column(name = "pay_key_no", length = 200)
    private String payKeyNo;

    @Comment("기본결제수단여부 Y/N")
    @Column(name = "main_method_yn", length = 1)
    private String mainMethodYn;

}
