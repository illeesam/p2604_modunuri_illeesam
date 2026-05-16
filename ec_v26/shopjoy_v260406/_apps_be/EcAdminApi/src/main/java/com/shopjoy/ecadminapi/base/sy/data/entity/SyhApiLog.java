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
@Table(name = "syh_api_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// API 로그 엔티티
@Comment("외부 API 연동 로그")
public class SyhApiLog extends BaseEntity {

    @Id
    @Comment("로그ID (YYMMDDhhmmss+rand4)")
    @Column(name = "log_id", length = 21, nullable = false)
    private String logId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("연동유형코드 (PG/LOGISTICS/KAKAO/NAVER/SMS 등)")
    @Column(name = "api_type_cd", length = 50, nullable = false)
    private String apiTypeCd;

    @Comment("API명 (예: 결제승인)")
    @Column(name = "api_nm", length = 100)
    private String apiNm;

    @Comment("화면명 (X-UI-Nm 헤더)")
    @Column(name = "ui_nm", length = 100)
    private String uiNm;

    @Comment("작업명 (X-Cmd-Nm 헤더)")
    @Column(name = "cmd_nm", length = 50)
    private String cmdNm;

    @Comment("HTTP 메서드")
    @Column(name = "method_cd", length = 10)
    private String methodCd;

    @Comment("호출 URL")
    @Column(name = "endpoint", length = 500)
    private String endpoint;

    @Comment("요청 파라미터 (민감정보 마스킹 처리)")
    @Column(name = "req_body", columnDefinition = "TEXT")
    private String reqBody;

    @Comment("응답 본문")
    @Column(name = "res_body", columnDefinition = "TEXT")
    private String resBody;

    @Comment("HTTP 응답코드")
    @Column(name = "http_status")
    private Integer httpStatus;

    @Comment("처리결과 (SUCCESS/FAIL)")
    @Column(name = "result_cd", length = 20)
    private String resultCd;

    @Comment("오류 메시지")
    @Column(name = "error_msg", length = 500)
    private String errorMsg;

    @Comment("응답시간 (밀리초)")
    @Column(name = "elapsed_ms")
    private Integer elapsedMs;

    @Comment("연관유형코드 (ORDER/DLIV/PUSH 등)")
    @Column(name = "ref_type_cd", length = 30)
    private String refTypeCd;

    @Comment("연관ID")
    @Column(name = "ref_id", length = 21)
    private String refId;

    @Comment("API 호출일시")
    @Column(name = "call_date")
    private LocalDateTime callDate;

}
