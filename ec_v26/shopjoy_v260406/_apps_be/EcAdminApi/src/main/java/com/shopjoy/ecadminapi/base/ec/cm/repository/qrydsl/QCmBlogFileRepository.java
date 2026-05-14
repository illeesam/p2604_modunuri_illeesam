package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;

import java.util.List;
import java.util.Optional;

/** CmBlogFile QueryDSL Custom Repository */
public interface QCmBlogFileRepository {

    Optional<CmBlogFileDto.Item> selectById(String blogImgId);

    List<CmBlogFileDto.Item> selectList(CmBlogFileDto.Request search);

    CmBlogFileDto.PageResponse selectPageList(CmBlogFileDto.Request search);

    int updateSelective(CmBlogFile entity);
}
