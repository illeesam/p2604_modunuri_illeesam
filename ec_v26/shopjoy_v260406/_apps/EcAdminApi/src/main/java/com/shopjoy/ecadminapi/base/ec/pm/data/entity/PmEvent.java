package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_event", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 이벤트 엔티티
public class PmEvent {

    @Id
    @Column(name = "event_id", length = 21, nullable = false)
    private String eventId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "event_nm", length = 100, nullable = false)
    private String eventNm;

    @Column(name = "event_type_cd", length = 20)
    private String eventTypeCd;

    @Column(name = "img_url", length = 500)
    private String imgUrl;

    @Column(name = "event_title", length = 200)
    private String eventTitle;

    @Lob
    @Column(name = "event_content", columnDefinition = "TEXT")
    private String eventContent;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "notice_start")
    private LocalDate noticeStart;

    @Column(name = "notice_end")
    private LocalDate noticeEnd;

    @Column(name = "event_status_cd", length = 20)
    private String eventStatusCd;

    @Column(name = "event_status_cd_before", length = 20)
    private String eventStatusCdBefore;

    @Column(name = "target_type_cd", length = 20)
    private String targetTypeCd;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "view_cnt")
    private Integer viewCnt;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Lob
    @Column(name = "event_desc", columnDefinition = "TEXT")
    private String eventDesc;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}