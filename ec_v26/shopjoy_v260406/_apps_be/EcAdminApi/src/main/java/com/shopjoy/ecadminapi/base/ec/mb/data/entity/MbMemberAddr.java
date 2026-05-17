package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "mb_member_addr", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 회원 주소 엔티티
@Comment("회원 배송지")
public class MbMemberAddr extends BaseEntity {

    @Id
    @Comment("배송지ID (YYMMDDhhmmss+rand4)")
    @Column(name = "member_addr_id", length = 21, nullable = false)
    private String memberAddrId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("배송지명 (예: 집, 회사)")
    @Column(name = "addr_nm", length = 50)
    private String addrNm;

    @Comment("수령자명")
    @Column(name = "recv_nm", length = 50, nullable = false)
    private String recvNm;

    @Comment("수령자 연락처")
    @Column(name = "recv_phone", length = 20, nullable = false)
    private String recvPhone;

    @Comment("우편번호")
    @Column(name = "zip_cd", length = 10)
    private String zipCd;

    @Comment("기본주소")
    @Column(name = "addr", length = 200)
    private String addr;

    @Comment("상세주소")
    @Column(name = "addr_detail", length = 200)
    private String addrDetail;

    @Comment("기본배송지여부 Y/N")
    @Column(name = "is_default", length = 1)
    private String isDefault;

}
