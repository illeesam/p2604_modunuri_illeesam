package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mb_member_group", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 회원 그룹 엔티티
public class MbMemberGroup {

    @Id
    @Column(name = "group_id", length = 21, nullable = false)
    private String groupId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "group_nm", length = 100, nullable = false)
    private String groupNm;

    @Lob
    @Column(name = "group_memo", columnDefinition = "TEXT")
    private String groupMemo;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}