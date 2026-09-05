package com.shopjoy.ecBeBo.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pdh_prod_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 상태 이력 엔티티
@Comment("상품 상태 이력")
public class PdhProdStatusHist extends BaseEntity {

    @Id
    @Comment("이력ID")
    @Column(name = "prod_status_hist_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodStatusHistId 는 21자 이내여야 합니다.")
    private String prodStatusHistId;


    @Comment("상품ID")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("이전상태 (코드: PROD_STATUS_CD)")
    @Column(name = "before_status_cd", length = 20)
    @Size(max = 20, message = "beforeStatusCd 는 20자 이내여야 합니다.")
    private String beforeStatusCd;

    @Comment("변경상태 (코드: PROD_STATUS_CD)")
    @Column(name = "after_status_cd", length = 20, nullable = false)
    @Size(max = 20, message = "afterStatusCd 는 20자 이내여야 합니다.")
    private String afterStatusCd;

    @Comment("처리메모")
    @Column(name = "memo", length = 300)
    @Size(max = 300, message = "memo 는 300자 이내여야 합니다.")
    private String memo;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "proc_user_id", length = 21)
    @Size(max = 21, message = "procUserId 는 21자 이내여야 합니다.")
    private String procUserId;

    @Comment("처리일시")
    @Column(name = "proc_date")
    private LocalDateTime procDate;

}
