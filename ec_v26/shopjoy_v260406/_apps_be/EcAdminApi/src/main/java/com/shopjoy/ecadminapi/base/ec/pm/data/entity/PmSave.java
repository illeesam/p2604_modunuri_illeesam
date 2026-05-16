package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

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
@Table(name = "pm_save", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 적립금 엔티티
@Comment("마일리지 적립/사용 이력")
public class PmSave extends BaseEntity {

    @Id
    @Comment("마일리지ID (YYMMDDhhmmss+rand4)")
    @Column(name = "save_id", length = 21, nullable = false)
    private String saveId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("유형 (코드: SAVE_TYPE — EARN/USE/EXPIRE/CANCEL/ADMIN)")
    @Column(name = "save_type_cd", length = 20, nullable = false)
    private String saveTypeCd;

    @Comment("변동액 (양수:적립, 음수:차감)")
    @Column(name = "save_amt", nullable = false)
    private Long saveAmt;

    @Comment("처리 후 잔액")
    @Column(name = "balance_amt")
    private Long balanceAmt;

    @Comment("연관유형 (ORDER/EVENT/ADMIN 등)")
    @Column(name = "ref_type_cd", length = 30)
    private String refTypeCd;

    @Comment("연관ID")
    @Column(name = "ref_id", length = 21)
    private String refId;

    @Comment("소멸예정일")
    @Column(name = "expire_date")
    private LocalDateTime expireDate;

    @Comment("메모")
    @Column(name = "save_memo", columnDefinition = "TEXT")
    private String saveMemo;

}
