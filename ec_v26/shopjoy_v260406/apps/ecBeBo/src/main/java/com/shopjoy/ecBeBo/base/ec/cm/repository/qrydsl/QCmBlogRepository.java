package com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmBlog;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** CmBlog QueryDSL Custom Repository */
public interface QCmBlogRepository {

    /** 단건 조회 */
    Optional<CmBlogDto.Item> selectById(String blogId);

    /** 카테고리별 공개(useYn=Y) 블로그 건수 — {blogCateId: count} (FO 사이드바 count, base 의 @Query countByBlogCate 대체) */
    Map<String, Long> selectCateCounts();

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<CmBlogDto.Item> selectList(CmBlogDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    BasePage<CmBlogDto.Item> selectPageData(CmBlogDto.Request search);

    int updateSelective(CmBlog entity);
}
