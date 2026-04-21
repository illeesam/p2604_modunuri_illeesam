package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "zz_sample1", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ZzSample1 {

    @Id
    @Column(name = "sample1_id", length = 21, nullable = false)
    private String sample1Id;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "title", length = 100, nullable = false)
    private String title;

    @Column(name = "content", length = 1000)
    private String content;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;
}
