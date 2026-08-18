package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.List;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import com.shopjoy.ecadminapi.base.sy.data.dto.AttachFile;
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

    @Comment("제목")
    @Column(name = "notice_title", length = 200, nullable = false)
    @NotBlank(message = "공지 제목을 입력해주세요.")
    @Size(max = 100, message = "공지 제목은 100자 이내로 입력해주세요.")
    private String noticeTitle;

    @Comment("공지유형 (코드: NOTICE_TYPE_CD)")
    @Column(name = "notice_type_cd", length = 30)
    private String noticeTypeCd;

    @Comment("상단고정 Y/N")
    @Column(name = "is_fixed", length = 1)
    private String isFixed;

    @Comment("내용 (HTML)")
    @Column(name = "content_html", columnDefinition = "TEXT")
    private String contentHtml;

    @Comment("노출시작일")
    @Column(name = "start_date")
    private LocalDate startDate;

    @Comment("노출종료일")
    @Column(name = "end_date")
    private LocalDate endDate;

    @Comment("상태 (ACTIVE/INACTIVE)")
    @Column(name = "notice_status_cd", length = 20)
    private String noticeStatusCd;

    @Comment("조회수")
    @Column(name = "view_count")
    private Integer viewCount;

    /** DB 컬럼 아님 — 첨부파일 목록. 요청 시엔 attachId/rowStatus(I/D) 만 채워 보내고,
     *  create()/update() 가 noticeId 확정 직후 같은 트랜잭션에서 sy_attach 에 반영한 뒤,
     *  같은 필드를 SyAttachService.getAttachFilesByRef() 결과로 덮어써 응답에 되돌려준다. */
    @Transient
    private List<AttachFile> attachFiles;

}
