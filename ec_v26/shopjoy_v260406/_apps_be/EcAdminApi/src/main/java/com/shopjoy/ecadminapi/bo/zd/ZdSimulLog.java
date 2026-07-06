package com.shopjoy.ecadminapi.bo.zd;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "zd_simul_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("시뮬레이터 실행 로그")
public class ZdSimulLog extends BaseEntity {

    @Id
    @Comment("로그ID (YYMMDDhhmmss+rand4)")
    @Column(name = "log_id", length = 21, nullable = false)
    private String logId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("도메인 (prod/member/order/claim/event/plan/promo/settle)")
    @Column(name = "domain", length = 30, nullable = false)
    private String domain;

    @Comment("실행유형 (생성/수정)")
    @Column(name = "simul_mode", length = 10, nullable = false)
    private String simulMode;

    @Comment("결과 (SUCCESS/FAIL)")
    @Column(name = "simul_status", length = 10, nullable = false)
    private String simulStatus;

    @Comment("실행 내용 설명")
    @Column(name = "desc_txt", columnDefinition = "TEXT")
    private String descTxt;

    @Comment("실패 사유")
    @Column(name = "reason_txt", columnDefinition = "TEXT")
    private String reasonTxt;

    @Comment("생성/수정된 엔티티 ID")
    @Column(name = "target_id", length = 21)
    private String targetId;

    @Comment("실행자명")
    @Column(name = "user_nm", length = 100)
    private String userNm;

    @Comment("화면명 (업무/화면 구분용)")
    @Column(name = "ui_nm", length = 50)
    private String uiNm;

    @Comment("생성/수정된 엔티티 상세 JSON")
    @Column(name = "detail_json", columnDefinition = "TEXT")
    private String detailJson;
}
