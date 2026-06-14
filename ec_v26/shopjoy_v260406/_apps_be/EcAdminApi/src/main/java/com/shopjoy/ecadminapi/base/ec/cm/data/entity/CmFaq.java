package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

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

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("FAQ 분류 표시경로 (sy_path.path_id, biz_cd=cm_faq)")
    @Column(name = "path_id", length = 21)
    private String pathId;

    @Comment("질문")
    @Column(name = "faq_question", length = 500, nullable = false)
    private String faqQuestion;

    @Comment("답변(HTML)")
    @Column(name = "faq_answer", columnDefinition = "TEXT")
    private String faqAnswer;

    @Comment("답변 첨부파일그룹ID (sy_attach_grp.attach_grp_id, grp_code=FAQ_ANSWER_ATTACH)")
    @Column(name = "answer_attach_grp_id", length = 21)
    private String answerAttachGrpId;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("노출여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("조회수")
    @Column(name = "view_count")
    private Integer viewCount;
}
