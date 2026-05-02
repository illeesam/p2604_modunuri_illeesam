package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_notice", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 공지사항 엔티티
public class SyNotice extends BaseEntity {

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

    @Column(name = "content_html", columnDefinition = "TEXT")
    private String contentHtml;

    @Column(name = "attach_grp_id", length = 21)
    private String attachGrpId;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "notice_status_cd", length = 20)
    private String noticeStatusCd;

    @Column(name = "view_count")
    private Integer viewCount;

}
