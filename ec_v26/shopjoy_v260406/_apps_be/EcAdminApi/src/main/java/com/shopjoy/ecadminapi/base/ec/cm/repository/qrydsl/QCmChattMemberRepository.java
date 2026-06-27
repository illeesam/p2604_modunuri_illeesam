package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMemberDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMember;

import java.util.List;
import java.util.Optional;

/** CmChattMember QueryDSL Custom Repository */
public interface QCmChattMemberRepository {

    Optional<CmChattMemberDto.Item> selectById(String chattMemberId);

    List<CmChattMemberDto.Item> selectList(CmChattMemberDto.Request search);

    CmChattMemberDto.PageResponse selectPageData(CmChattMemberDto.Request search);

    int updateSelective(CmChattMember entity);
}
