package com.shopjoy.eccdnapi.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * EcCdnApi 를 호출하는 내부 서비스 계정(cf_client 테이블) — id/pwd 로 로그인해 accessToken 을 받는다.
 * EcAdminApi 가 대표적인(현재는 유일한) 호출자다. 필드에 기본값을 두지 않는다(project 전역 규칙).
 */
@Entity
@Table(name = "cf_client")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CfClient {

    @Id
    @Column(name = "client_id", length = 40)
    private String clientId;

    /** BCrypt 해시. 평문 저장 금지. */
    @Column(name = "client_pwd", length = 200)
    private String clientPwd;

    @Column(name = "client_nm", length = 100)
    private String clientNm;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_date")
    private LocalDateTime updDate;
}
