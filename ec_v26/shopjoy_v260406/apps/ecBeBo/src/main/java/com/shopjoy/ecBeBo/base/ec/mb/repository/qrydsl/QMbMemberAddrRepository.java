package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;

import java.util.List;
import java.util.Optional;

/** MbMemberAddr QueryDSL Custom Repository */
public interface QMbMemberAddrRepository {

    Optional<MbMemberAddrDto.Item> selectById(String memberAddrId);

    List<MbMemberAddrDto.Item> selectList(MbMemberAddrDto.Request search);

    BasePage<MbMemberAddrDto.Item> selectPageData(MbMemberAddrDto.Request search);

    int updateSelective(MbMemberAddr entity);
}
