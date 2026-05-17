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
    private String userId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("로그인 아이디")
    @Column(name = "login_id", length = 50, nullable = false)
    private String loginId;

    @Comment("비밀번호 (bcrypt)")
    @Column(name = "login_pwd_hash", length = 255, nullable = false)
    private String loginPwdHash;

    @Comment("사용자명")
    @Column(name = "user_nm", length = 50, nullable = false)
    private String userNm;

    @Comment("이메일")
    @Column(name = "user_email", length = 100)
    private String userEmail;

    @Comment("연락처")
    @Column(name = "user_phone", length = 20)
    private String userPhone;

    @Comment("부서ID (sy_dept.dept_id)")
    @Column(name = "dept_id", length = 21)
    private String deptId;

    @Comment("역할ID (sy_role.role_id)")
    @Column(name = "role_id", length = 21)
    private String roleId;

    @Comment("상태 (코드: USER_STATUS)")
    @Column(name = "user_status_cd", length = 20)
    private String userStatusCd;

    @Comment("최근 로그인")
    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Comment("로그인 실패 횟수")
    @Column(name = "login_fail_cnt")
    private Integer loginFailCnt;

    @Comment("메모")
    @Column(name = "user_memo", columnDefinition = "TEXT")
    private String userMemo;

    @Comment("인증방식 (코드: AUTH_METHOD)")
    @Column(name = "auth_method_cd", length = 20)
    private String authMethodCd;

    @Comment("마지막 로그인 일시")
    @Column(name = "last_login_date")
    private LocalDateTime lastLoginDate;

    @Comment("프로필 첨부아이디")
    @Column(name = "profile_attach_id", length = 21)
    private String profileAttachId;

}
