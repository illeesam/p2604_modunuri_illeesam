package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogReply;

import java.util.List;
import java.util.Optional;

/** CmBlogReply QueryDSL Custom Repository */
public interface QCmBlogReplyRepository {

    /** 단건 조회 */
    Optional<CmBlogReplyDto.Item> selectById(String commentId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<CmBlogReplyDto.Item> selectList(CmBlogReplyDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    CmBlogReplyDto.PageResponse selectPageList(CmBlogReplyDto.Request search);

    int updateSelective(CmBlogReply entity);
}
