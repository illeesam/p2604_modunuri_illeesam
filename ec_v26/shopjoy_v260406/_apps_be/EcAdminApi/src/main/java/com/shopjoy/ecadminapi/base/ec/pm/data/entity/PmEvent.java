package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pm_event", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 이벤트 엔티티
@Comment("이벤트")
public class PmEvent extends BaseEntity {

    @Id
    @Comment("이벤트ID (YYMMDDhhmmss+rand4)")
    @Column(name = "event_id", length = 21, nullable = false)
    private String eventId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("이벤트명")
    @Column(name = "event_nm", length = 100, nullable = false)
    private String eventNm;

    @Comment("이벤트유형 (코드: EVENT_TYPE)")
    @Column(name = "event_type_cd", length = 20)
    private String eventTypeCd;

    @Comment("배너이미지URL")
    @Column(name = "img_url", length = 500)
    private String imgUrl;

    @Comment("이벤트 제목")
    @Column(name = "event_title", length = 200)
    private String eventTitle;

    @Comment("이벤트 상세내용")
    @Column(name = "event_content", columnDefinition = "TEXT")
    private String eventContent;

    @Comment("이벤트 시작일")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Comment("이벤트 종료일")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Comment("예고 시작일")
    @Column(name = "notice_start")
    private LocalDate noticeStart;

    @Comment("예고 종료일")
    @Column(name = "notice_end")
    private LocalDate noticeEnd;

    @Comment("상태 (코드: EVENT_STATUS)")
    @Column(name = "event_status_cd", length = 20)
    private String eventStatusCd;

    @Comment("변경 전 이벤트상태 (코드: EVENT_STATUS)")
    @Column(name = "event_status_cd_before", length = 20)
    private String eventStatusCdBefore;

    @Comment("대상유형 (코드: EVENT_TARGET)")
    @Column(name = "target_type_cd", length = 20)
    private String targetTypeCd;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("조회수")
    @Column(name = "view_cnt")
    private Integer viewCnt;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("이벤트설명")
    @Column(name = "event_desc", columnDefinition = "TEXT")
    private String eventDesc;

}
