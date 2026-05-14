package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;

import java.util.List;
import java.util.Optional;

/** MbLike QueryDSL Custom Repository */
public interface QMbLikeRepository {

    Optional<MbLikeDto.Item> selectById(String likeId);

    List<MbLikeDto.Item> selectList(MbLikeDto.Request search);

    MbLikeDto.PageResponse selectPageList(MbLikeDto.Request search);

    int updateSelective(MbLike entity);
}
