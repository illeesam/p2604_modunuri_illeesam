package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_notice", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 공지사항 엔티티
public class SyNotice {

    @Id
    @Column(name = "notice_id", length = 21, nullable = false)
    private String noticeId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "notice_title", length = 200, nullable = false)
    private String noticeTitle;

    @Column(name = "notice_type_cd", length = 30)
    private String noticeTypeCd;

    @Column(name = "is_fixed", length = 1)
    private String isFixed;

    @Lob
    @Column(name = "content_html", columnDefinition = "TEXT")
    private String contentHtml;

    @Column(name = "attach_grp_id", length = 21)
    private String attachGrpId;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "notice_status_cd", length = 20)
    private String noticeStatusCd;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}