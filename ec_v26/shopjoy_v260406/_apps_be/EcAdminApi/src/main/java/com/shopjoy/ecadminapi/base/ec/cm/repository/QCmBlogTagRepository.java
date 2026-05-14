package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;

import java.util.List;
import java.util.Optional;

/** CmBlogTag QueryDSL Custom Repository */
public interface QCmBlogTagRepository {

    /** 단건 조회 */
    Optional<CmBlogTagDto.Item> selectById(String blogTagId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<CmBlogTagDto.Item> selectList(CmBlogTagDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    CmBlogTagDto.PageResponse selectPageList(CmBlogTagDto.Request search);

    int updateSelective(CmBlogTag entity);
}
