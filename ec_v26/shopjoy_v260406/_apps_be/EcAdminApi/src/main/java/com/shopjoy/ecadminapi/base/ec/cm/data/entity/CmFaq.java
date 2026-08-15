package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;
import com.shopjoy.ecadminapi.base.sy.data.dto.AttachFile;

import java.util.List;

@Entity
@Table(name = "cm_faq", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("FAQ (자주 묻는 질문)")
public class CmFaq extends BaseEntity {

    @Id
    @Comment("FAQ ID (YYMMDDhhmmss+rand4)")
    @Column(name = "faq_id", length = 21, nullable = false)
    private String faqId;


    @Comment("FAQ 분류 표시경로 (sy_path.path_id, biz_cd=cm_faq)")
    @Column(name = "path_id", length = 21)
    private String pathId;

    @Comment("질문")
    @Column(name = "faq_question", length = 500, nullable = false)
    private String faqQuestion;

    @Comment("답변(HTML)")
    @Column(name = "faq_answer", columnDefinition = "TEXT")
    private String faqAnswer;


    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("노출여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("조회수")
    @Column(name = "view_count")
    private Integer viewCount;

    /** DB 컬럼 아님 — 첨부파일 목록. 요청 시엔 attachId/rowStatus(I/D) 만 채워 보내고,
     *  create()/update() 가 faqId 확정 직후 같은 트랜잭션에서 sy_attach 에 반영한 뒤,
     *  같은 필드를 SyAttachService.getAttachFilesByRef() 결과로 덮어써 응답에 되돌려준다. */
    @Transient
    private List<AttachFile> attachFiles;
}
