package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_vendor_user", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 업체 사용자 엔티티
@Comment("판매/배송업체 사용자 (담당자/실무자)")
public class SyVendorUser extends BaseEntity {

    @Id
    @Comment("판매/배송업체사용자ID (PK)")
    @Column(name = "vendor_user_id", length = 21, nullable = false)
    private String vendorUserId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("판매/배송업체ID (sy_vendor.vendor_id)")
    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Comment("사용자ID (sy_user.user_id, NULL=비로그인)")
    @Column(name = "user_id", length = 21)
    private String userId;

    @Comment("이름")
    @Column(name = "member_nm", length = 50, nullable = false)
    private String memberNm;

    @Comment("직위/직책 (코드: POSITION)")
    @Column(name = "position_cd", length = 20)
    private String positionCd;

    @Comment("부서/팀명")
    @Column(name = "vendor_user_dept_nm", length = 100)
    private String vendorUserDeptNm;

    @Comment("사무실 전화")
    @Column(name = "vendor_user_phone", length = 20)
    private String vendorUserPhone;

    @Comment("휴대전화")
    @Column(name = "vendor_user_mobile", length = 20, nullable = false)
    private String vendorUserMobile;

    @Comment("이메일")
    @Column(name = "vendor_user_email", length = 100, nullable = false)
    private String vendorUserEmail;

    @Comment("생년월일")
    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Comment("대표 담당자 여부 (업체당 1명 권장)")
    @Column(name = "is_main", length = 1)
    private String isMain;

    @Comment("업체 관리권한 여부 (Y=업체 정보 수정 가능)")
    @Column(name = "auth_yn", length = 1)
    private String authYn;

    @Comment("등록(합류) 일자")
    @Column(name = "join_date")
    private LocalDate joinDate;

    @Comment("퇴직/탈퇴 일자")
    @Column(name = "leave_date")
    private LocalDate leaveDate;

    @Comment("상태 (코드: VENDOR_MEMBER_STATUS)")
    @Column(name = "vendor_user_status_cd", length = 20)
    private String vendorUserStatusCd;

    @Comment("비고")
    @Column(name = "vendor_user_remark", length = 500)
    private String vendorUserRemark;

}
