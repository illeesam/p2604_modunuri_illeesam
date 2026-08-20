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
@Table(name = "syh_api_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// API 로그 엔티티
@Comment("외부 API 연동 로그")
public class SyhApiLog extends BaseEntity {

    @Id
    @Comment("로그ID (YYMMDDhhmmss+rand4)")
    @Column(name = "log_id", length = 21, nullable = false)
    @Size(max = 21, message = "logId 는 21자 이내여야 합니다.")
    private String logId;

    @Comment("연동유형코드 (PG/LOGISTICS/KAKAO/NAVER/SMS 등)")
    @Column(name = "api_type_cd", length = 50, nullable = false)
    @Size(max = 50, message = "apiTypeCd 는 50자 이내여야 합니다.")
    private String apiTypeCd;

    @Comment("API명 (예: 결제승인)")
    @Column(name = "api_nm", length = 100)
    @Size(max = 100, message = "apiNm 는 100자 이내여야 합니다.")
    private String apiNm;

    @Comment("화면명 (X-UI-Nm 헤더)")
    @Column(name = "ui_nm", length = 100)
    @Size(max = 100, message = "uiNm 는 100자 이내여야 합니다.")
    private String uiNm;

    @Comment("작업명 (X-Cmd-Nm 헤더)")
    @Column(name = "cmd_nm", length = 50)
    @Size(max = 50, message = "cmdNm 는 50자 이내여야 합니다.")
    private String cmdNm;

    @Comment("HTTP 메서드")
    @Column(name = "method_cd", length = 10)
    @Size(max = 10, message = "methodCd 는 10자 이내여야 합니다.")
    private String methodCd;

    @Comment("호출 URL")
    @Column(name = "endpoint", length = 500)
    @Size(max = 500, message = "endpoint 는 500자 이내여야 합니다.")
    private String endpoint;

    @Comment("요청 파라미터 (민감정보 마스킹 처리)")
    @Column(name = "req_body", columnDefinition = "TEXT")
    @Size(max = 50000, message = "reqBody 는 50000자 이내여야 합니다.")
    private String reqBody;

    @Comment("응답 본문")
    @Column(name = "res_body", columnDefinition = "TEXT")
    @Size(max = 50000, message = "resBody 는 50000자 이내여야 합니다.")
    private String resBody;

    @Comment("HTTP 응답코드")
    @Column(name = "http_status")
    private Integer httpStatus;

    @Comment("처리결과 (SUCCESS/FAIL)")
    @Column(name = "result_cd", length = 20)
    @Size(max = 20, message = "resultCd 는 20자 이내여야 합니다.")
    private String resultCd;

    @Comment("오류 메시지")
    @Column(name = "error_msg", length = 500)
    @Size(max = 500, message = "errorMsg 는 500자 이내여야 합니다.")
    private String errorMsg;

    @Comment("응답시간 (밀리초)")
    @Column(name = "elapsed_ms")
    private Integer elapsedMs;

    @Comment("연관유형코드 (ORDER/DLIV/PUSH 등)")
    @Column(name = "ref_type_cd", length = 30)
    @Size(max = 30, message = "refTypeCd 는 30자 이내여야 합니다.")
    private String refTypeCd;

    @Comment("연관ID")
    @Column(name = "ref_id", length = 21)
    @Size(max = 21, message = "refId 는 21자 이내여야 합니다.")
    private String refId;

    @Comment("API 호출일시")
    @Column(name = "call_date")
    private LocalDateTime callDate;

}
