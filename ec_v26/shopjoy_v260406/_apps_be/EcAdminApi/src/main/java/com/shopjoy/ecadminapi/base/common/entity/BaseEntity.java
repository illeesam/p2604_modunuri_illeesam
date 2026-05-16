package com.shopjoy.ecadminapi.base.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import org.hibernate.annotations.Comment;

@MappedSuperclass
@Getter @Setter
@SuperBuilder
@NoArgsConstructor
public abstract class BaseEntity {

    @Transient
    private String rowStatus;   // I/U/D — DB 저장 안 함, saveList 용도

    @Comment("등록자")
    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Comment("등록일")
    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Comment("수정자")
    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Comment("수정일")
    @Column(name = "upd_date")
    private LocalDateTime updDate;
}
