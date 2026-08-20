package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "memberAddrId 는 21자 이내여야 합니다.")
    private String memberAddrId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("배송지명 (예: 집, 회사)")
    @Column(name = "addr_nm", length = 50)
    @Size(max = 50, message = "addrNm 는 50자 이내여야 합니다.")
    private String addrNm;

    @Comment("수령자명")
    @Column(name = "recv_nm", length = 50, nullable = false)
    @Size(max = 50, message = "recvNm 는 50자 이내여야 합니다.")
    private String recvNm;

    @Comment("수령자 연락처")
    @Column(name = "recv_phone", length = 20, nullable = false)
    @Size(max = 20, message = "recvPhone 는 20자 이내여야 합니다.")
    private String recvPhone;

    @Comment("우편번호")
    @Column(name = "zip_cd", length = 10)
    @Size(max = 10, message = "zipCd 는 10자 이내여야 합니다.")
    private String zipCd;

    @Comment("기본주소")
    @Column(name = "addr", length = 200)
    @Size(max = 200, message = "addr 는 200자 이내여야 합니다.")
    private String addr;

    @Comment("상세주소")
    @Column(name = "addr_detail", length = 200)
    @Size(max = 200, message = "addrDetail 는 200자 이내여야 합니다.")
    private String addrDetail;

    @Comment("기본배송지여부 Y/N")
    @Column(name = "is_default", length = 1)
    @Size(max = 1, message = "isDefault 는 1자 이내여야 합니다.")
    private String isDefault;

}
