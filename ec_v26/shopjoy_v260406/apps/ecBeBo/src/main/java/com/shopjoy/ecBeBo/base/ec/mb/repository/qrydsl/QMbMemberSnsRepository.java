package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;

import java.util.List;
import java.util.Optional;

/** MbMemberSns QueryDSL Custom Repository */
public interface QMbMemberSnsRepository {

    Optional<MbMemberSnsDto.Item> selectById(String memberSnsId);

    /** 소셜 로그인 매칭 시 snsChannelCd+snsUserId 필터로 selectList 사용 (단일테이블+조인 → §14.6.9). */
    List<MbMemberSnsDto.Item> selectList(MbMemberSnsDto.Request search);

    BasePage<MbMemberSnsDto.Item> selectPageData(MbMemberSnsDto.Request search);

    int updateSelective(MbMemberSns entity);
}
