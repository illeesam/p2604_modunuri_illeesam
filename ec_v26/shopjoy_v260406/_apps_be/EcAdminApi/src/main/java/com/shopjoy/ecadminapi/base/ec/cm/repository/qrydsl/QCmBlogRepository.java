package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;

import java.util.List;
import java.util.Optional;

/** CmBlog QueryDSL Custom Repository */
public interface QCmBlogRepository {

    /** 단건 조회 */
    Optional<CmBlogDto.Item> selectById(String blogId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<CmBlogDto.Item> selectList(CmBlogDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    CmBlogDto.PageResponse selectPageList(CmBlogDto.Request search);

    int updateSelective(CmBlog entity);
}
