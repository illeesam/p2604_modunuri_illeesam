package com.shopjoy.ecadminapi.domain.pm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_event_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class PmEventItem {

    @Id
    @Column(name = "event_item_id", length = 20, nullable = false)
    private String eventItemId;

    @Column(name = "event_id", length = 20, nullable = false)
    private String eventId;

    @Column(name = "site_id", length = 20)
    private String siteId;

    @Column(name = "target_type_cd", length = 20, nullable = false)
    private String targetTypeCd;

    @Column(name = "target_id", length = 20, nullable = false)
    private String targetId;

    @Column(name = "sort_no")
    private Integer sortNo;

    @Column(name = "reg_by", length = 20)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

}