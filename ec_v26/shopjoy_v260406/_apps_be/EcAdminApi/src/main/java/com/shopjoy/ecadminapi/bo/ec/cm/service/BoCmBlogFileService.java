package com.shopjoy.ecadminapi.bo.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO CmBlogFile 서비스 — base CmBlogFileService 위임 (thin wrapper).
 * 블로그 첨부 이미지(cm_blog_file) 의 BO 측 목록/일괄저장 진입점.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoCmBlogFileService {

    private final CmBlogFileService cmBlogFileService;

    /* 목록조회 (blogId 필터) */
    public List<CmBlogFileDto.Item> getList(CmBlogFileDto.Request req) { return cmBlogFileService.getList(req); }

    /* 일괄 저장 (추가/수정/삭제) */
    @Transactional public void saveListBase(List<CmBlogFile> rows) { cmBlogFileService.saveListBase(rows); }
}
