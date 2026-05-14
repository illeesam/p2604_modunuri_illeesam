package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogGoodDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;

import java.util.List;
import java.util.Optional;

/** CmBlogGood QueryDSL Custom Repository */
public interface QCmBlogGoodRepository {

    /** 단건 조회 */
    Optional<CmBlogGoodDto.Item> selectById(String likeId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<CmBlogGoodDto.Item> selectList(CmBlogGoodDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    CmBlogGoodDto.PageResponse selectPageList(CmBlogGoodDto.Request search);

    int updateSelective(CmBlogGood entity);
}
