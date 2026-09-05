package com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmBlogCateDto;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmBlogCate;

import java.util.List;
import java.util.Optional;

/** CmBlogCate QueryDSL Custom Repository */
public interface QCmBlogCateRepository {

    Optional<CmBlogCateDto.Item> selectById(String blogCateId);

    List<CmBlogCateDto.Item> selectList(CmBlogCateDto.Request search);

    BasePage<CmBlogCateDto.Item> selectPageData(CmBlogCateDto.Request search);

    int updateSelective(CmBlogCate entity);

    /** 루트 blogCate + 모든 자손 blog_cate_id 수집(트리조회 §14.6.9 — QueryDSL 전체조회 + 자바 BFS) */
    List<String> selectTreeBlogCateIds(String rootBlogCateId);
}
