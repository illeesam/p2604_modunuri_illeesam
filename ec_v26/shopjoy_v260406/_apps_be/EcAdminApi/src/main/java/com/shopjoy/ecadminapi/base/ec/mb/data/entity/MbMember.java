package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

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
@Table(name = "mb_member", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 회원 엔티티
@Comment("회원")
public class MbMember extends BaseEntity {

    @Id
    @Comment("회원ID (YYMMDDhhmmss+rand4)")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("이메일 (로그인 ID)")
    @Column(name = "login_id", length = 100, nullable = false)
    private String loginId;

    @Comment("비밀번호 (bcrypt)")
    @Column(name = "login_pwd_hash", length = 255, nullable = false)
    private String loginPwdHash;

    @Comment("회원명")
    @Column(name = "member_nm", length = 50, nullable = false)
    private String memberNm;

    @Comment("연락처")
    @Column(name = "member_phone", length = 20)
    private String memberPhone;

    @Comment("성별 M/F")
    @Column(name = "member_gender", length = 1)
    private String memberGender;

    @Comment("생년월일")
    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Comment("등급 (코드: MEMBER_GRADE)")
    @Column(name = "grade_cd", length = 20)
    private String gradeCd;

    @Comment("상태 (코드: MEMBER_STATUS)")
    @Column(name = "member_status_cd", length = 20)
    private String memberStatusCd;

    @Comment("변경 전 회원상태 (코드: MEMBER_STATUS)")
    @Column(name = "member_status_cd_before", length = 20)
    private String memberStatusCdBefore;

    @Comment("가입일")
    @Column(name = "join_date")
    private LocalDateTime joinDate;

    @Comment("최근 로그인")
    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Comment("주문 건수")
    @Column(name = "order_count")
    private Integer orderCount;

    @Comment("누적 구매금액")
    @Column(name = "total_purchase_amt")
    private Long totalPurchaseAmt;

    @Comment("적립금 잔액")
    @Column(name = "cache_balance_amt")
    private Long cacheBalanceAmt;

    @Comment("우편번호")
    @Column(name = "member_zip_code", length = 10)
    private String memberZipCode;

    @Comment("주소")
    @Column(name = "member_addr", length = 200)
    private String memberAddr;

    @Comment("상세주소")
    @Column(name = "member_addr_detail", length = 200)
    private String memberAddrDetail;

    @Comment("메모")
    @Column(name = "member_memo", columnDefinition = "TEXT")
    private String memberMemo;

}
