package com.shopjoy.ecadminapi.base.sy.data.entity;

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
@Table(name = "sy_user", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 사용자(관리자) 엔티티
@Comment("관리자 사용자")
public class SyUser extends BaseEntity {

    @Id
    @Comment("사용자ID (YYMMDDhhmmss+rand4)")
    @Column(name = "user_id", length = 21, nullable = false)
    @Size(max = 21, message = "userId 는 21자 이내여야 합니다.")
    private String userId;


    @Comment("로그인 아이디")
    @Column(name = "login_id", length = 50, nullable = false)
    @Size(max = 50, message = "loginId 는 50자 이내여야 합니다.")
    private String loginId;

    @Comment("비밀번호 (bcrypt)")
    @Column(name = "login_pwd_hash", length = 255, nullable = false)
    @Size(max = 100, message = "loginPwdHash 는 100자 이내여야 합니다.")
    private String loginPwdHash;

    @Comment("사용자명")
    @Column(name = "user_nm", length = 50, nullable = false)
    @Size(max = 50, message = "userNm 는 50자 이내여야 합니다.")
    private String userNm;

    @Comment("이메일")
    @Column(name = "user_email", length = 100)
    @Size(max = 100, message = "userEmail 는 100자 이내여야 합니다.")
    private String userEmail;

    @Comment("연락처")
    @Column(name = "user_phone", length = 20)
    @Size(max = 20, message = "userPhone 는 20자 이내여야 합니다.")
    private String userPhone;

    @Comment("부서ID (sy_dept.dept_id)")
    @Column(name = "dept_id", length = 21)
    @Size(max = 21, message = "deptId 는 21자 이내여야 합니다.")
    private String deptId;

    @Comment("역할ID (sy_role.role_id)")
    @Column(name = "role_id", length = 21)
    @Size(max = 21, message = "roleId 는 21자 이내여야 합니다.")
    private String roleId;

    @Comment("상태 (코드: USER_STATUS_CD)")
    @Column(name = "user_status_cd", length = 20)
    @Size(max = 20, message = "userStatusCd 는 20자 이내여야 합니다.")
    private String userStatusCd;

    @Comment("최근 로그인")
    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Comment("로그인 실패 횟수")
    @Column(name = "login_fail_cnt")
    private Integer loginFailCnt;

    @Comment("메모")
    @Column(name = "user_memo", columnDefinition = "TEXT")
    @Size(max = 500000, message = "userMemo 는 500,000자 이내여야 합니다.")
    private String userMemo;

    @Comment("인증방식 (코드: AUTH_METHOD_CD)")
    @Column(name = "auth_method_cd", length = 20)
    @Size(max = 20, message = "authMethodCd 는 20자 이내여야 합니다.")
    private String authMethodCd;

    @Comment("마지막 로그인 일시")
    @Column(name = "last_login_date")
    private LocalDateTime lastLoginDate;

    @Comment("프로필 첨부아이디")
    @Column(name = "profile_attach_id", length = 21)
    @Size(max = 21, message = "profileAttachId 는 21자 이내여야 합니다.")
    private String profileAttachId;

}
