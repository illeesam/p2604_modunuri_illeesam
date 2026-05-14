package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogCate;

import java.util.List;
import java.util.Optional;

/** CmBlogCate QueryDSL Custom Repository */
public interface QCmBlogCateRepository {

    Optional<CmBlogCateDto.Item> selectById(String blogCateId);

    List<CmBlogCateDto.Item> selectList(CmBlogCateDto.Request search);

    CmBlogCateDto.PageResponse selectPageList(CmBlogCateDto.Request search);

    int updateSelective(CmBlogCate entity);
}
