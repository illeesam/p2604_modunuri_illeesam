package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "eventId 는 21자 이내여야 합니다.")
    private String eventId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("이벤트명")
    @Column(name = "event_nm", length = 100, nullable = false)
    @Size(max = 100, message = "eventNm 는 100자 이내여야 합니다.")
    private String eventNm;

    @Comment("이벤트유형 (코드: EVENT_TYPE_CD)")
    @Column(name = "event_type_cd", length = 20)
    @Size(max = 20, message = "eventTypeCd 는 20자 이내여야 합니다.")
    private String eventTypeCd;

    @Comment("배너이미지URL")
    @Column(name = "img_url", length = 500)
    @Size(max = 100, message = "imgUrl 는 100자 이내여야 합니다.")
    private String imgUrl;

    @Comment("이벤트 제목")
    @Column(name = "event_title", length = 200)
    @NotBlank(message = "이벤트 제목을 입력해주세요.")
    @Size(max = 100, message = "이벤트 제목은 100자 이내로 입력해주세요.")
    private String eventTitle;

    @Comment("이벤트 상세내용")
    @Column(name = "event_content", columnDefinition = "TEXT")
    @Size(max = 500000, message = "eventContent 는 500,000자 이내여야 합니다.")
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

    @Comment("상태 (코드: EVENT_STATUS_CD)")
    @Column(name = "event_status_cd", length = 20)
    @Size(max = 20, message = "eventStatusCd 는 20자 이내여야 합니다.")
    private String eventStatusCd;

    @Comment("변경 전 이벤트상태 (코드: EVENT_STATUS_CD)")
    @Column(name = "event_status_cd_before", length = 20)
    @Size(max = 20, message = "eventStatusCdBefore 는 20자 이내여야 합니다.")
    private String eventStatusCdBefore;

    @Comment("대상유형 (코드: EVENT_TARGET)")
    @Column(name = "target_type_cd", length = 20)
    @Size(max = 20, message = "targetTypeCd 는 20자 이내여야 합니다.")
    private String targetTypeCd;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("조회수")
    @Column(name = "view_cnt")
    private Integer viewCnt;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("이벤트설명")
    @Column(name = "event_desc", columnDefinition = "TEXT")
    @Size(max = 500000, message = "eventDesc 는 500,000자 이내여야 합니다.")
    private String eventDesc;

    @Comment("시뮬데이터여부 (Y/N)")
    @Column(name = "simul_yn", length = 1, columnDefinition = "VARCHAR(1) DEFAULT 'N'")
    @Size(max = 1, message = "simulYn 는 1자 이내여야 합니다.")
    private String simulYn;

}
