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
@Table(name = "sy_notice", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 공지사항 엔티티
@Comment("공지사항")
public class SyNotice extends BaseEntity {

    @Id
    @Comment("공지ID (YYMMDDhhmmss+rand4)")
    @Column(name = "notice_id", length = 21, nullable = false)
    private String noticeId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("제목")
    @Column(name = "notice_title", length = 200, nullable = false)
    private String noticeTitle;

    @Comment("공지유형 (코드: NOTICE_TYPE)")
    @Column(name = "notice_type_cd", length = 30)
    private String noticeTypeCd;

    @Comment("상단고정 Y/N")
    @Column(name = "is_fixed", length = 1)
    private String isFixed;

    @Comment("내용 (HTML)")
    @Column(name = "content_html", columnDefinition = "TEXT")
    private String contentHtml;

    @Comment("첨부파일그룹ID")
    @Column(name = "attach_grp_id", length = 21)
    private String attachGrpId;

    @Comment("노출시작일")
    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Comment("노출종료일")
    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Comment("상태 (ACTIVE/INACTIVE)")
    @Column(name = "notice_status_cd", length = 20)
    private String noticeStatusCd;

    @Comment("조회수")
    @Column(name = "view_count")
    private Integer viewCount;

}
