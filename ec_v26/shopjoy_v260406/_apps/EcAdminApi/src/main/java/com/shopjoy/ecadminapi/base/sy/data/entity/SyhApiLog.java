package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "syh_api_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// API 로그 엔티티
public class SyhApiLog extends BaseEntity {

    @Id
    @Column(name = "log_id", length = 21, nullable = false)
    private String logId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "api_type_cd", length = 50, nullable = false)
    private String apiTypeCd;

    @Column(name = "api_nm", length = 100)
    private String apiNm;

    @Column(name = "ui_nm", length = 100)
    private String uiNm;

    @Column(name = "cmd_nm", length = 50)
    private String cmdNm;

    @Column(name = "method_cd", length = 10)
    private String methodCd;

    @Column(name = "endpoint", length = 500)
    private String endpoint;

    @Column(name = "req_body", columnDefinition = "TEXT")
    private String reqBody;

    @Column(name = "res_body", columnDefinition = "TEXT")
    private String resBody;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(name = "result_cd", length = 20)
    private String resultCd;

    @Column(name = "error_msg", length = 500)
    private String errorMsg;

    @Column(name = "elapsed_ms")
    private Integer elapsedMs;

    @Column(name = "ref_type_cd", length = 30)
    private String refTypeCd;

    @Column(name = "ref_id", length = 21)
    private String refId;

    @Column(name = "call_date")
    private LocalDateTime callDate;

}
