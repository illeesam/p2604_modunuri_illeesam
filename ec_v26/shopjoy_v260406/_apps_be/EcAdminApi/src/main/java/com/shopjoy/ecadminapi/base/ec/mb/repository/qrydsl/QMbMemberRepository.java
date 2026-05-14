package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;

import java.util.List;
import java.util.Optional;

/** MbMember QueryDSL Custom Repository */
public interface QMbMemberRepository {

    /** 단건 조회 */
    Optional<MbMemberDto.Item> selectById(String memberId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<MbMemberDto.Item> selectList(MbMemberDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    MbMemberDto.PageResponse selectPageList(MbMemberDto.Request search);

    int updateSelective(MbMember entity);
}
