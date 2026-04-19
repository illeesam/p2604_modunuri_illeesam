package com.shopjoy.ecadminapi.domain.cm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cm_bltn_file", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CmBltnFile {

    @Id
    @Column(name = "blog_img_id", length = 20, nullable = false)
    private String blogImgId;

    @Column(name = "blog_id", length = 20, nullable = false)
    private String blogId;

    @Column(name = "img_url", length = 500, nullable = false)
    private String imgUrl;

    @Column(name = "thumb_url", length = 500)
    private String thumbUrl;

    @Column(name = "img_alt_text", length = 200)
    private String imgAltText;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "reg_by", length = 20)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

}