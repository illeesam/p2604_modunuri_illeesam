package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;

import java.util.List;
import java.util.Optional;

/** MbMemberSns QueryDSL Custom Repository */
public interface QMbMemberSnsRepository {

    Optional<MbMemberSnsDto.Item> selectById(String memberSnsId);

    List<MbMemberSnsDto.Item> selectList(MbMemberSnsDto.Request search);

    MbMemberSnsDto.PageResponse selectPageList(MbMemberSnsDto.Request search);

    int updateSelective(MbMemberSns entity);
}
