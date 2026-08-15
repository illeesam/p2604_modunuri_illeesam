package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.List;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import com.shopjoy.ecadminapi.base.sy.data.dto.AttachFile;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_contact", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 문의 엔티티
@Comment("고객문의")
public class SyContact extends BaseEntity {

    @Id
    @Comment("문의ID (YYMMDDhhmmss+rand4)")
    @Column(name = "contact_id", length = 21, nullable = false)
    private String contactId;


    @Comment("회원ID")
    @Column(name = "member_id", length = 21)
    private String memberId;

    @Comment("문의자명")
    @Column(name = "member_nm", length = 50)
    private String memberNm;

    @Comment("문의유형")
    @Column(name = "category_cd", length = 30)
    private String categoryCd;

    @Comment("제목")
    @Column(name = "contact_title", length = 200, nullable = false)
    private String contactTitle;

    @Comment("문의내용")
    @Column(name = "contact_content", columnDefinition = "TEXT")
    private String contactContent;

    @Comment("처리상태 (코드: CONTACT_STATUS_CD)")
    @Column(name = "contact_status_cd", length = 20)
    private String contactStatusCd;

    @Comment("답변내용")
    @Column(name = "contact_answer", columnDefinition = "TEXT")
    private String contactAnswer;

    @Comment("답변자 (sy_user.user_id)")
    @Column(name = "answer_user_id", length = 21)
    private String answerUserId;

    @Comment("답변일시")
    @Column(name = "answer_date")
    private LocalDateTime answerDate;

    @Comment("문의일시")
    @Column(name = "contact_date")
    private LocalDateTime contactDate;

    /** DB 컬럼 아님 — 문의 내용 첨부파일 목록(1번째 슬롯). 요청 시엔 attachId/rowStatus(I/D) 만
     *  채워 보내고, create()/update() 가 contactId 확정 직후 같은 트랜잭션에서
     *  sy_attach("sy_contact_content")에 반영한 뒤, 같은 필드를 SyAttachService.getAttachFilesByRef()
     *  결과로 덮어써 응답에 되돌려준다. */
    @Transient
    private List<AttachFile> attachFiles;

    /** DB 컬럼 아님 — 답변 첨부파일 목록(2번째 슬롯 → attach2Files). content 와 동일한 방식으로
     *  update() 가 sy_attach("sy_contact_answer")에 반영 후 같은 필드를 덮어써 되돌려준다. */
    @Transient
    private List<AttachFile> attach2Files;

}
