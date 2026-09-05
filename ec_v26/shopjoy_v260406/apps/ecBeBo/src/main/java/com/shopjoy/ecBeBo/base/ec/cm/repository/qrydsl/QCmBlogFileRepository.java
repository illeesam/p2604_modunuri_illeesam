package com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmBlogFile;

import java.util.List;
import java.util.Optional;

/** CmBlogFile QueryDSL Custom Repository */
public interface QCmBlogFileRepository {

    Optional<CmBlogFileDto.Item> selectById(String blogFileId);

    List<CmBlogFileDto.Item> selectList(CmBlogFileDto.Request search);

    BasePage<CmBlogFileDto.Item> selectPageData(CmBlogFileDto.Request search);

    int updateSelective(CmBlogFile entity);
}
